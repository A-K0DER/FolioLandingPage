import { DurableObject } from "cloudflare:workers";
import type { Env } from "./types";

export interface Order {
  paymentId: string;
  email: string;
  name: string;
  issued: string;
  status: "paid" | "refunded";
}

export type ActivateResult =
  | { kind: "unknown" }
  | { kind: "refunded" }
  | { kind: "in_use"; since: string }
  | { kind: "ok"; activated: string; email: string; name: string };

/**
 * All license state lives in one instance of this class. A Durable Object runs one
 * request at a time, so seat taking is atomic.
 */
export class LicenseStore extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        payment_id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        issued TEXT NOT NULL,
        status TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS seats (
        payment_id TEXT PRIMARY KEY,
        machine TEXT NOT NULL,
        activated TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS handled (
        payment_id TEXT PRIMARY KEY
      );
      CREATE TABLE IF NOT EXISTS rate_limits (
        bucket TEXT PRIMARY KEY,
        window_start INTEGER NOT NULL,
        count INTEGER NOT NULL
      );
    `);
  }

  /** Stores the order unless one exists (a refund tombstone is kept). */
  recordPayment(o: Omit<Order, "status">): { status: Order["status"]; handled: boolean } {
    const sql = this.ctx.storage.sql;
    sql.exec(
      `INSERT INTO orders (payment_id, email, name, issued, status) VALUES (?, ?, ?, ?, 'paid')
       ON CONFLICT(payment_id) DO UPDATE SET email = excluded.email, name = excluded.name, issued = excluded.issued
       WHERE orders.email = ''`,
      o.paymentId, o.email, o.name, o.issued,
    );
    const row = sql.exec<{ status: Order["status"] }>(
      "SELECT status FROM orders WHERE payment_id = ?", o.paymentId,
    ).one();
    const handled =
      sql.exec("SELECT 1 FROM handled WHERE payment_id = ?", o.paymentId).toArray().length > 0;
    return { status: row.status, handled };
  }

  markHandled(paymentId: string): void {
    this.ctx.storage.sql.exec("INSERT OR IGNORE INTO handled (payment_id) VALUES (?)", paymentId);
  }

  /** Marks the order refunded. An unknown order is stored as a tombstone, so a late payment event can't revive it. */
  refund(paymentId: string): void {
    this.ctx.storage.sql.exec(
      `INSERT INTO orders (payment_id, email, name, issued, status) VALUES (?, '', '', '', 'refunded')
       ON CONFLICT(payment_id) DO UPDATE SET status = 'refunded'`,
      paymentId,
    );
  }

  activate(paymentId: string, machine: string, today: string): ActivateResult {
    return this.ctx.storage.transactionSync(() => {
      const sql = this.ctx.storage.sql;
      const order = sql.exec<{ email: string; name: string; status: string }>(
        "SELECT email, name, status FROM orders WHERE payment_id = ?", paymentId,
      ).toArray()[0];
      if (!order || order.email === "") return { kind: "unknown" } as const;
      if (order.status === "refunded") return { kind: "refunded" } as const;
      const seat = sql.exec<{ machine: string; activated: string }>(
        "SELECT machine, activated FROM seats WHERE payment_id = ?", paymentId,
      ).toArray()[0];
      if (seat && seat.machine !== machine) return { kind: "in_use", since: seat.activated } as const;
      if (seat) return { kind: "ok", activated: seat.activated, email: order.email, name: order.name } as const;
      sql.exec("INSERT INTO seats (payment_id, machine, activated) VALUES (?, ?, ?)", paymentId, machine, today);
      return { kind: "ok", activated: today, email: order.email, name: order.name } as const;
    });
  }

  /** Frees the seat only if `machine` matches the one on record. */
  deactivate(paymentId: string, machine: string): { kind: "ok" | "not_activated" } {
    const res = this.ctx.storage.sql.exec(
      "DELETE FROM seats WHERE payment_id = ? AND machine = ?", paymentId, machine,
    );
    return { kind: res.rowsWritten > 0 ? "ok" : "not_activated" };
  }

  /** Fixed-window counter. Returns false once `limit` requests have been seen in the current minute. */
  allow(bucket: string, limit: number, nowMs: number): boolean {
    const sql = this.ctx.storage.sql;
    const window = Math.floor(nowMs / 60_000) * 60_000;
    // Drop stale buckets so the table doesn't grow without bound.
    sql.exec("DELETE FROM rate_limits WHERE window_start < ?", window - 60_000);
    const row = sql.exec<{ window_start: number; count: number }>(
      "SELECT window_start, count FROM rate_limits WHERE bucket = ?", bucket,
    ).toArray()[0];
    const count = row && row.window_start === window ? row.count : 0;
    if (count >= limit) return false;
    sql.exec(
      `INSERT INTO rate_limits (bucket, window_start, count) VALUES (?, ?, ?)
       ON CONFLICT(bucket) DO UPDATE SET window_start = excluded.window_start, count = excluded.count`,
      bucket, window, count + 1,
    );
    return true;
  }
}
