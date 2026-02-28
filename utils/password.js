const crypto = require('crypto');
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  const saltHex = salt.toString('hex');
  const hashHex = Buffer.from(bits).toString('hex');
  return `${saltHex}:${hashHex}`;
}
async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  const computed = Buffer.from(bits).toString('hex');
  return computed === hashHex;
}
module.exports = { hashPassword, verifyPassword };