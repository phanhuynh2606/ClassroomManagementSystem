const User = require("../models/user.model");


const getUsersByRole = async (req, res) => {
  const { role } = req.query;
  const query = role ? { role } : {};
  const users = await User.find(query).select('-password -__v -createdAt -refreshToken ');
  res.status(200).json({
    success: true,
    data: users,
  });
};

const verifyTeacher = async (req, res) => {
  const { userId } = req.params;
  const {verified } = req.body;
  const user = await User.findByIdAndUpdate(userId, { verified: verified }, { new: true });
  res.status(200).json({
    success: true,
    data: user,
  });
};

const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { userData } = req.body;
  console.log(userData)
  const user = await User.findByIdAndUpdate(userId, userData, { new: true });
  res.status(200).json({
    success: true,
    data: user,
  });
};
module.exports = {
  getUsersByRole,
  verifyTeacher,
  updateUser,
};
