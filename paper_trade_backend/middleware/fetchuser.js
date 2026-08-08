const jwt = require('jsonwebtoken');

const fetchuser = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Session is invalid or expired.' });
  }
};

module.exports = fetchuser;
