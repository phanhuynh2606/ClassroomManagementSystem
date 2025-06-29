const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");

// Protect routes
const protect = async (req, res, next) => {
  try {
    let accessToken;
    // Get access token from header
    if (req.headers.authorization?.startsWith("Bearer")) {
      accessToken = req.headers.authorization.split(" ")[1];
    }

    if (!accessToken) {
      return res.status(401).json({ 
        message: "Not authorized, no access token",
        code: "NO_ACCESS_TOKEN"
      });
    }

    try {
      // Verify access token
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ 
          message: "Not authorized, user not found",
          code: "USER_NOT_FOUND"
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          message: "Not authorized, user is inactive",
          code: "USER_INACTIVE"
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ 
          message: "Access token expired",
          code: "ACCESS_TOKEN_EXPIRED"
        });
      }

      return res.status(401).json({ 
        message: "Not authorized, invalid token",
        code: "INVALID_TOKEN"
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
