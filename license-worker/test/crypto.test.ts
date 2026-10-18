import { describe, expect, it } from "vitest";
import { LICENSE_PREFIX, canonicalJson, signLicense, signToken, verifyLicense } from "../src/crypto";

// RFC 8032 test key. Never for real keys.
const SEED = "nWGxne/9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A=";
const PUBLIC = "11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=";

describe("license key vectors", () => {
  it("vector 1 (ASCII)", async () => {
    const details = { email: "ada@example.com", issued: "2026-10-18", name: "Ada Lovelace", order: "pay_test_123", product: "folio" };
    expect(canonicalJson(details)).toBe(
      '{"email":"ada@example.com","issued":"2026-10-18","name":"Ada Lovelace","order":"pay_test_123","product":"folio"}',
    );
    expect(await signLicense(details, SEED)).toBe(
      "FOLIO-eyJlbWFpbCI6ImFkYUBleGFtcGxlLmNvbSIsImlzc3VlZCI6IjIwMjYtMTAtMTgiLCJuYW1lIjoiQWRhIExvdmVsYWNlIiwib3JkZXIiOiJwYXlfdGVzdF8xMjMiLCJwcm9kdWN0IjoiZm9saW8ifQ.OmYkMm9gg9JWmuH7SRosuRhUXnwitbDnVmHstOpsi5TaEu6GCDQjkydPfMqIxFav2FEVr1KDXgtGEW4hgyJ2DA",
    );
  });

  it("vector 2 (non-ASCII name as UTF-8)", async () => {
    const details = { email: "zoe@example.com", issued: "2026-10-18", name: "Zoë Ångström", order: "pay_test_456", product: "folio" };
    // The vector as first supplied had one typo in the details segment ("…MThiLCJ…" for "…MTgiLCJ…"),
    // which decodes to invalid JSON ("2026-10-18b,"). Its signature segment is correct and matches exactly.
    expect(await signLicense(details, SEED)).toBe(
      "FOLIO-eyJlbWFpbCI6InpvZUBleGFtcGxlLmNvbSIsImlzc3VlZCI6IjIwMjYtMTAtMTgiLCJuYW1lIjoiWm_DqyDDhW5nc3Ryw7ZtIiwib3JkZXIiOiJwYXlfdGVzdF80NTYiLCJwcm9kdWN0IjoiZm9saW8ifQ.rwKomn_1I6GC-fbWNK5C9iEP4GjG49ZNOdsq6trJL18D9hVa0PfgY3-jtGXvuuMUIyVevMWjsEgXISS7aqLPAQ",
    );
  });
});

describe("activation token vector", () => {
  it("matches", async () => {
    const token = await signToken(
      { activated: "2026-10-20", email: "ada@example.com", machine: "00112233445566778899AABBCCDDEEFF", name: "Ada Lovelace", order: "pay_test_123", product: "folio" },
      SEED,
    );
    expect(token).toBe(
      "FOLIOACT-eyJhY3RpdmF0ZWQiOiIyMDI2LTEwLTIwIiwiZW1haWwiOiJhZGFAZXhhbXBsZS5jb20iLCJtYWNoaW5lIjoiMDAxMTIyMzM0NDU1NjY3Nzg4OTlBQUJCQ0NEREVFRkYiLCJuYW1lIjoiQWRhIExvdmVsYWNlIiwib3JkZXIiOiJwYXlfdGVzdF8xMjMiLCJwcm9kdWN0IjoiZm9saW8ifQ.HN9OTGD60WJpv6nZXbNAm0_d4MRkWsj7Au5lDmhV5ysBn91kBV94hgc2oebc3b_K2EdF5T3nViGSeRjRy4sLCQ",
    );
  });
});

describe("verifyLicense", () => {
  const details = { email: "ada@example.com", issued: "2026-10-18", name: "Ada Lovelace", order: "pay_test_123", product: "folio" };

  it("accepts a good key and rejects tampering, wrong prefix and wrong product", async () => {
    const key = await signLicense(details, SEED);
    expect((await verifyLicense(key, PUBLIC))?.order).toBe("pay_test_123");

    const [d, s] = key.slice(LICENSE_PREFIX.length).split(".");
    const flipped = d.slice(0, 10) + (d[10] === "A" ? "B" : "A") + d.slice(11);
    expect(await verifyLicense(`FOLIO-${flipped}.${s}`, PUBLIC)).toBeNull();
    expect(await verifyLicense(`FOLIO-${d}.${s.slice(0, -2)}AA`, PUBLIC)).toBeNull();
    expect(await verifyLicense(key.replace("FOLIO-", "FOLIOACT-"), PUBLIC)).toBeNull();
    expect(await verifyLicense("FOLIO-", PUBLIC)).toBeNull();
    expect(await verifyLicense(`${key}.extra`, PUBLIC)).toBeNull();

    const other = await signLicense({ ...details, product: "other" }, SEED);
    expect(await verifyLicense(other, PUBLIC)).toBeNull();
  });
});
