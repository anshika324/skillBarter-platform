const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { resolveUserRole } = require('./roles');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const rawAuthHeader = req.header('Authorization');
    const token = typeof rawAuthHeader === 'string'
      ? rawAuthHeader.replace(/^Bearer\s+/i, '')
      : undefined;

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const userId = decoded?.id || decoded?._id || decoded?.userId;
    const user = userId ? await User.findById(userId).select('-password') : null;

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive. Contact support.' });
    }

    const resolvedRole = resolveUserRole(user);
    if (!user.role) {
      user.role = resolvedRole;
      await user.save();
    } else if (user.role !== resolvedRole) {
      user.role = resolvedRole;
    }

    // Attach user to request
    req.user = user;
    req.user.role = resolvedRole;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
