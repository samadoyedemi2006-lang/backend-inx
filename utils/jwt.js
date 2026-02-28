const crypto = require('crypto');
async function getKey() {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}
function base64urlEncode(data) {
  return Buffer.from(data).toString('base64url');
}
async function signJWT(payload) {
  const key = await getKey();
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64urlEncode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 * 7 }));
  const dataToSign = new TextEncoder().encode(`${header}.${body}`);
  const sigArrayBuffer = await crypto.subtle.sign('HMAC', key, dataToSign);
  const sig = base64urlEncode(sigArrayBuffer);
  return `${header}.${body}.${sig}`;
}
async function verifyJWT(token) {
  try {
    const key = await getKey();
    const [header, body, sig] = token.split('.');
    const sigBytes = Buffer.from(sig, 'base64url');
    const dataToVerify = new TextEncoder().encode(`${header}.${body}`);
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, dataToVerify);
    if (!valid) return null;
    const payloadStr = Buffer.from(body, 'base64url').toString();
    const payload = JSON.parse(payloadStr);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
module.exports = { signJWT, verifyJWT };