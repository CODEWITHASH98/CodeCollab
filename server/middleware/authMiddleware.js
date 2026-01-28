import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Missing token' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // attach to request
    req.user = {
      id: decoded.id,
      userId: decoded.userId,
      userName: decoded.userName,
      email: decoded.email || null,
      isGuest: !!decoded.isGuest,
      role: decoded.role || (decoded.isGuest ? 'guest' : 'user'),
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid/expired token' });
  }
}

export function requireRegistered(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  if (req.user.isGuest) {
    return res.status(403).json({ success: false, error: 'Requires registered account', upgrade: true });
  }
  next();
}
