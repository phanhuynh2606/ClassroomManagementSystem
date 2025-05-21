const User = require("../models/user.model");


const getUsersByRole = async (req, res) => {
  const { role } = req.query;
  const users = await User.find({ role }).select('-password -__v -createdAt -refreshToken ');
  res.status(200).json({
    success: true,
    data: users,
  });
};


module.exports = {
  getUsersByRole,
};
