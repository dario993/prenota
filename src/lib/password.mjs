import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

/**
 * @param {string} pw
 * @returns {Promise<string>} "scrypt$<saltHex>$<hashHex>"
 */
export async function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = /** @type {Buffer} */ (await scryptAsync(pw, salt, KEYLEN));
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/**
 * @param {string} pw
 * @param {string} salvato
 * @returns {Promise<boolean>}
 */
export async function verificaPassword(pw, salvato) {
  const [schema, saltHex, hashHex] = String(salvato).split("$");
  if (schema !== "scrypt" || !saltHex || !hashHex) return false;
  const atteso = Buffer.from(hashHex, "hex");
  if (atteso.length !== KEYLEN) return false;
  const hash = /** @type {Buffer} */ (
    await scryptAsync(pw, Buffer.from(saltHex, "hex"), KEYLEN)
  );
  return timingSafeEqual(hash, atteso);
}
