const B64URL = /^[A-Za-z0-9_-]*$/;
const PKCS8_ED25519_PREFIX = "302e020100300506032b657004220420";

export const LICENSE_PREFIX = "FOLIO-";
export const TOKEN_PREFIX = "FOLIOACT-";

export interface LicenseDetails {
  email: string;
  issued: string;
  name: string;
  order: string;
  product: string;
}

export interface TokenDetails {
  activated: string;
  email: string;
  machine: string;
  name: string;
  order: string;
  product: string;
}

export function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(s: string): Uint8Array | null {
  if (!B64URL.test(s) || s.length % 4 === 1) return null;
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

function fromHex(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/../g)!, (h) => parseInt(h, 16));
}

function fromBase64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

/** Compact JSON, keys sorted alphabetically, non-ASCII left as UTF-8. */
export function canonicalJson(fields: Record<string, string>): string {
  const sorted: Record<string, string> = {};
  for (const k of Object.keys(fields).sort()) sorted[k] = fields[k];
  return JSON.stringify(sorted);
}

const privateKeys = new Map<string, Promise<CryptoKey>>();
const publicKeys = new Map<string, Promise<CryptoKey>>();

/** `seedB64` is base64 of the 32-byte Ed25519 seed. */
export function importPrivateKey(seedB64: string): Promise<CryptoKey> {
  let key = privateKeys.get(seedB64);
  if (!key) {
    const seed = fromBase64(seedB64);
    if (seed.length !== 32) throw new Error("FOLIO_LICENSE_PRIVATE_KEY must be a base64 32-byte seed");
    const der = new Uint8Array(48);
    der.set(fromHex(PKCS8_ED25519_PREFIX));
    der.set(seed, 16);
    key = crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, false, ["sign"]);
    privateKeys.set(seedB64, key);
  }
  return key;
}

/** `rawB64` is base64 of the raw 32-byte Ed25519 public key. */
export function importPublicKey(rawB64: string): Promise<CryptoKey> {
  let key = publicKeys.get(rawB64);
  if (!key) {
    const raw = fromBase64(rawB64);
    if (raw.length !== 32) throw new Error("FOLIO_LICENSE_PUBLIC_KEY must be a base64 32-byte key");
    key = crypto.subtle.importKey("raw", raw, { name: "Ed25519" }, false, ["verify"]);
    publicKeys.set(rawB64, key);
  }
  return key;
}

export async function signString(
  prefix: string,
  fields: Record<string, string>,
  privateKeyB64: string,
): Promise<string> {
  const details = new TextEncoder().encode(canonicalJson(fields));
  const sig = await crypto.subtle.sign("Ed25519", await importPrivateKey(privateKeyB64), details);
  return `${prefix}${b64urlEncode(details)}.${b64urlEncode(new Uint8Array(sig))}`;
}

export function signLicense(details: LicenseDetails, privateKeyB64: string): Promise<string> {
  return signString(LICENSE_PREFIX, { ...details }, privateKeyB64);
}

export function signToken(details: TokenDetails, privateKeyB64: string): Promise<string> {
  return signString(TOKEN_PREFIX, { ...details }, privateKeyB64);
}

/** Returns the parsed details if the signature is valid, otherwise null. */
export async function verifySigned(
  prefix: string,
  value: string,
  publicKeyB64: string,
): Promise<Record<string, unknown> | null> {
  if (!value.startsWith(prefix)) return null;
  const parts = value.slice(prefix.length).split(".");
  if (parts.length !== 2) return null;
  const details = b64urlDecode(parts[0]);
  const sig = b64urlDecode(parts[1]);
  if (!details || !sig || sig.length !== 64) return null;
  const ok = await crypto.subtle.verify("Ed25519", await importPublicKey(publicKeyB64), sig, details);
  if (!ok) return null;
  try {
    const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(details));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function verifyLicense(key: string, publicKeyB64: string): Promise<LicenseDetails | null> {
  const d = await verifySigned(LICENSE_PREFIX, key, publicKeyB64);
  if (!d || d.product !== "folio") return null;
  for (const f of ["email", "issued", "name", "order"] as const) {
    if (typeof d[f] !== "string") return null;
  }
  return d as unknown as LicenseDetails;
}
