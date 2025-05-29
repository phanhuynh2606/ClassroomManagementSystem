const User = require('../models/user.model');
const cloudinary = require('../config/cloudinary.config');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = req.body.username || user.username;
      user.fullName = req.body.fullName || user.fullName;
      user.phone = req.body.phone || user.phone;
      user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
      user.gender = req.body.gender || user.gender;
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload profile image
// @route   POST /api/users/profile/image
// @access  Private
const uploadProfileImage = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log(req.file)
    
    const userUpload = await User.findById(userId);
    if (!userUpload) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const imageUrl = req.file?.path;
    userUpload.image = imageUrl;
    await userUpload.save();
    
    res.json({ 
      success: true, 
      imageUrl,
      message: 'Profile image updated successfully'
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
}; 