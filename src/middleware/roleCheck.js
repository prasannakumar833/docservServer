exports.checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user.permissions || !req.user.permissions[permission]) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to ${permission.replace('can', '').toLowerCase()}`
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};
