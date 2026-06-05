/**
 * services/encryptionService.js — Servicio de cifrado AES-256-CBC
 * Asegura la protección de credenciales sensibles (GitHub Personal Access Tokens)
 */

'use strict';

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
// Derivar una clave de 32 bytes a partir de un secreto de forma segura
const SECRET_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'gestiocambios-scm-secret-key-2026', 'salt', 32);
const IV_LENGTH = 16;

/**
 * Cifra un texto plano usando AES-256-CBC
 * @param {string} text
 * @returns {string} iv:cipherText
 */
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Descifra un texto cifrado usando AES-256-CBC
 * @param {string} encryptedText
 * @returns {string|null} texto plano descifrado
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  try {
    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) return null;
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encrypted = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[EncryptionService] Decrypt error:', err.message);
    return null;
  }
}

module.exports = { encrypt, decrypt };
