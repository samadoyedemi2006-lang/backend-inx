const { verifyJWT } = require('../utils/jwt');
async function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = auth.slice(7);
  const payload = await verifyJWT(token);
  if (!payload) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.user = payload;
  next();
}
module.exports = authenticate;