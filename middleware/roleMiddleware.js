/**
 * Role-based access control middleware.
 * Usage: authorise('admin', 'ngo')
 */
const authorise = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Access denied. This route is restricted to: ${roles.join(', ')}`
      );
    }

    // Donors and NGOs must be approved before accessing protected features
    if (
      (req.user.role === 'donor' || req.user.role === 'ngo') &&
      !req.user.isApproved
    ) {
      res.status(403);
      throw new Error(
        'Your account is pending admin approval. You will be notified once approved.'
      );
    }

    next();
  };
};

module.exports = { authorise };
