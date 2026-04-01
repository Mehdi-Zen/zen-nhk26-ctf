/**
 * Démo HPKE + ML-KEM (post-quantum KEM) en TypeScript / Node.js.
 *
 * Étapes :
 *  0) challengeSeed (info CTF, PAS une seed crypto)
 *  1) Construire la suite HPKE : ML-KEM-768 + HKDF-SHA256 + AES-256-GCM
 *  2) Générer clé publique/privée (recipient)
 *  3) Chiffrement : sender.seal() -> ciphertext + sender.enc
 *  4) Déchiffrement : recipient.open() avec enc + ciphertext
 */

import { Aes256Gcm, CipherSuite, HkdfSha256 } from "@hpke/core";
import { MlKem768 } from "@hpke/ml-kem";

const te = new TextEncoder();
const td = new TextDecoder();

// shared suite instance factory
function makeSuite() {
  return new CipherSuite({
    kem: new MlKem768(),
    kdf: new HkdfSha256(),
    aead: new Aes256Gcm(),
  });
}

/**
 * Encode ArrayBuffer/Uint8Array en base64.
 * Works in Node and navigateur.
 */
export function toBase64(x: ArrayBuffer | Uint8Array): string {
  const u8 = x instanceof Uint8Array ? x : new Uint8Array(x);
  // Node Buffer provides simpler API
  if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
    return Buffer.from(u8).toString("base64");
  }
  // browser fallback
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < u8.length; i += chunkSize) {
    binary += String.fromCharCode(...u8.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// -----------------------------------------------------------------------------
// utility exports: conversions, key gen, encrypt, decrypt
// -----------------------------------------------------------------------------


export async function generateRecipientKeyPair(): Promise<{
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}> {
  const suite = makeSuite();
  return suite.kem.generateKeyPair();
}

/**
 * Encrypt a UTF‑8 message for the given recipient public key.
 * Returns the encapsulation (enc) and AEAD ciphertext.
 */
export async function encryptMessage(
  recipientPublicKey: CryptoKey,
  message: string,
): Promise<{enc: ArrayBuffer; ciphertext: ArrayBuffer}> {
  const suite = makeSuite();
  const sender = await suite.createSenderContext({recipientPublicKey});
  const pt = te.encode(message);
  const ciphertext = await sender.seal(pt.buffer);
  return {enc: sender.enc, ciphertext};
}

/**
 * Decrypt a previously encrypted message using recipient private key.
 * Requires the encapsulation value produced by `encryptMessage`.
 */
export async function decryptMessage(
  recipientPrivateKey: CryptoKey,
  enc: ArrayBuffer,
  ciphertext: ArrayBuffer,
): Promise<string> {
  const suite = makeSuite();
  const recipient = await suite.createRecipientContext({
    recipientKey: recipientPrivateKey,
    enc,
  });
  const pt = await recipient.open(ciphertext);
  return td.decode(pt);
}

