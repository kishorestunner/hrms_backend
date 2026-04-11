const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userRole = req.user.role.toLowerCase();

      // ✅ convert allowedRoles also to lowercase
      const normalizedRoles = allowedRoles.map(r => r.toLowerCase());

      if (!normalizedRoles.includes(userRole)) {
        return res.status(403).json({
          message: `Access denied for role: ${userRole}`,
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  };
};

module.exports = roleMiddleware;