const DEFAULT_ROLE = 'creator';
const VALID_ROLES = ['learner', 'creator', 'admin'];

function resolveUserRole(user = null) {
  if (!user) return DEFAULT_ROLE;

  if (VALID_ROLES.includes(user.role)) {
    return user.role;
  }

  // Backward compatibility for older users that have no role stored.
  if (typeof user.email === 'string' && user.email.toLowerCase().includes('admin')) {
    return 'admin';
  }

  return DEFAULT_ROLE;
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = resolveUserRole(req.user);

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        currentRole: role
      });
    }

    req.user.role = role;
    next();
  };
}

function isAdmin(user) {
  return resolveUserRole(user) === 'admin';
}

function isCreatorOrAdmin(user) {
  const role = resolveUserRole(user);
  return role === 'creator' || role === 'admin';
}

module.exports = {
  DEFAULT_ROLE,
  VALID_ROLES,
  resolveUserRole,
  requireRoles,
  isAdmin,
  isCreatorOrAdmin
};
