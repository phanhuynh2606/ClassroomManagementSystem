const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');
const { extractDeviceInfo } = require('../utils/Helper.js');
const { OAuth2Client } = require('google-auth-library');
const { sendEmail, emailTemplates } = require('../config/email.config.js');
const crypto = require('crypto');
const axios = require('axios');

// Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate access token
  const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '15m', // Access token expires in 15 minutes
    });
  };

// Generate refresh token
const generateRefreshToken = (id, deviceInfo) => {
  return jwt.sign(
    { 
      id,
      type: 'refresh',
      device: deviceInfo.device,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent
    }, 
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d', // Refresh token expires in 7 days
    }
  );
};

// Set refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      role: role || 'student',
      verified: role === 'teacher' ? false : true
    });
    if(user.role === 'teacher'){
      return res.status(200).json({ 
        success: true,
        message: 'Contact admin to confirm teacher',
        verified: false
       });
    }
    if (user) {
      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const deviceInfo = {
        device: req.headers['user-agent'],
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };
      const refreshToken = generateRefreshToken(user._id, deviceInfo);

      // Add refresh token to user
      await user.addRefreshToken({
        token: refreshToken,
        device: deviceInfo.device,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Set refresh token in cookie
      setRefreshTokenCookie(res, refreshToken);
      user.lastLogin = new Date();
      await user.save();
      res.status(201).json({
        message: 'Registration successful',
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        accessToken
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if(user.role === 'teacher' && !user.verified){
      return res.status(400).json({ 
        success: false,
        message: 'Contact admin to confirm teacher',
       });
    }
    if(user.isActive === false){
      return res.status(400).json({ 
        success: false,
        message: 'Your account is not active please contact admin to activate your account',
       });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const deviceInfo = extractDeviceInfo(req);
    const refreshToken = generateRefreshToken(user._id, deviceInfo);

    // Add refresh token to user
    await user.addRefreshToken({
      token: refreshToken,
      device: deviceInfo.deviceName,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.browser,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Set refresh token in cookie
    setRefreshTokenCookie(res, refreshToken);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Get user without sensitive data
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      image: user.image,
      isActive: user.isActive
    };

    res.status(200).json({
      message: 'Login successful',
      user: userResponse,
      accessToken
    });  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'No refresh token found' });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Revoke the refresh token
      await user.revokeRefreshToken(refreshToken);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      // Even if token is invalid, clear the cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Revoke all refresh tokens
    await user.revokeAllRefreshTokens();

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile fetched successfully',  
      data: user
    }); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "No refresh token provided",
        code: "NO_REFRESH_TOKEN"
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Check if token is a refresh token
      if (decoded.type !== "refresh") {
        return res.status(401).json({
          message: "Invalid token type",
          code: "INVALID_TOKEN_TYPE"
        });
      }

      // Find user and check if token is valid
      const user = await User.findOne({
        _id: decoded.id,
        "refreshTokens.token": refreshToken,
        "refreshTokens.expiresAt": { $gt: new Date() }
      });

      if (!user) {
        // Clear the refresh token cookie
        res.clearCookie('refreshToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        return res.status(401).json({
          message: "Invalid refresh token",
          code: "REFRESH_TOKEN_EXPIRED"
        });
      }

      // Generate new access token
      const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1m"
      });

      res.status(200).json({
        message: "Token refreshed successfully",
        accessToken: newAccessToken
      });
    } catch (error) {
      // Clear the refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return res.status(401).json({
        message: "Invalid refresh token",
        code: "REFRESH_TOKEN_EXPIRED"
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Logout specific device
// @route   POST /api/auth/logout-device
// @access  Private
const logoutDevice = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the specific token
    const tokenIndex = user.refreshTokens.findIndex(t => t.token === token);
    if (tokenIndex === -1) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // If this is the current device, clear the cookie and return special response
    const currentToken = req.cookies.refreshToken;
    const isCurrentDevice = currentToken === token;

    // Remove the token completely from database
    user.refreshTokens.splice(tokenIndex, 1);
    await user.save();

    // Clear cookie if it's current device
    if (isCurrentDevice) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return res.status(200).json({ 
        message: 'Current device logged out successfully',
        isCurrentDevice: true
      });
    }

    res.status(200).json({ 
      message: 'Device logged out successfully',
      isCurrentDevice: false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's devices
// @route   GET /api/auth/devices
// @access  Private
const getUserDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentToken = req.cookies.refreshToken;
    // Chỉ lấy các token chưa hết hạn (vì đã xóa hoàn toàn các token logout)
    const activeTokens = user.refreshTokens.filter(token => 
      token.expiresAt > new Date()
    );

    const devices = activeTokens.map(token => ({
      token: token.token,
      device: token.device,
      ipAddress: token.ipAddress,
      userAgent: token.userAgent,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      isCurrentDevice: token.token === currentToken
    }));

    res.status(200).json({
      message: 'Devices fetched successfully',
      data: devices
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Google OAuth login
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    });

    if (user) {
      // Update user's Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        fullName: name,
        email: email,
        googleId: googleId,
        image: picture,
        role: 'student', // Default role for Google sign-up
        verified: true,
        isActive: true,
        password: undefined // No password for Google users
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Your account is not active. Please contact admin to activate your account.',
      }); 
    }
    
    // Check if teacher is verified
    if (user.role === 'teacher' && !user.verified) {
      return res.status(400).json({ 
        success: false,
        message: 'Contact admin to confirm teacher status',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const deviceInfo = extractDeviceInfo(req);
    const refreshToken = generateRefreshToken(user._id, deviceInfo);

    // Add refresh token to user
    await user.addRefreshToken({
      token: refreshToken,
      device: deviceInfo.deviceName,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.browser,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Set refresh token in cookie
    setRefreshTokenCookie(res, refreshToken);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Get user without sensitive data
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      image: user.image,
      isActive: user.isActive,
      googleId: user.googleId
    };

    res.status(200).json({
      message: 'Google login successful',
      user: userResponse,
      accessToken
    });
  } catch (error) {
    console.error('Google login error:', error);
    if (error.message.includes('Token used too early')) {
      return res.status(400).json({ message: 'Invalid Google token timing' });
    }
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Check if user has social login account (no password)
    if ((user.googleId || user.facebookId) && !user.password) {
      const provider = user.googleId ? 'Google' : 'Facebook';
      return res.status(400).json({ 
        message: `This account uses ${provider} login. Please sign in with ${provider}.` 
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      // Send email
      await sendEmail(
        user.email,
        'Password Reset Request - Learning Management System',
        emailTemplates.resetPassword(resetUrl, user.fullName)
      );

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully'
      });
    } catch (error) {
      console.error('Email sending error:', error);
      
      // Clear reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        message: 'Email could not be sent. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Hash the token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Revoke all refresh tokens for security
    user.refreshTokens = [];
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify reset token
// @route   GET /api/auth/verify-reset-token/:token
// @access  Public
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired reset token' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      email: user.email
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Facebook OAuth login
// @route   POST /api/auth/facebook
// @access  Public
const facebookLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Facebook access token is required' });
    }

    try {
      // Verify Facebook access token and get user info
      const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture,first_name,last_name,gender,birthday&access_token=${accessToken}`);
      const { id: facebookId, name, email, picture, first_name, last_name, gender, birthday } = response.data;
      if (!email) {
        return res.status(400).json({ 
          message: 'Email not provided by Facebook. Please ensure your Facebook account has a verified email.' 
        });
      }

      // Check if user exists
      let user = await User.findOne({ 
        $or: [
          { email: email },
          { facebookId: facebookId }
        ]
      });

      if (user) {
        // Update user's Facebook ID if not set
        if (!user.facebookId) {
          user.facebookId = facebookId;
          await user.save();
        }
      } else {
        // Create new user
        user = await User.create({
          fullName: name || `${first_name || ''} ${last_name || ''}`.trim(),
          email: email,
          facebookId: facebookId,
          image: picture?.data?.url || '',
          gender: gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'other',
          dateOfBirth: birthday ? new Date(birthday) : undefined,
          role: 'student', // Default role for Facebook sign-up
          verified: true,
          isActive: true,
          password: undefined // No password for Facebook users
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(400).json({ 
          success: false,
          message: 'Your account is not active. Please contact admin to activate your account.',
        }); 
      }
      
      // Check if teacher is verified
      if (user.role === 'teacher' && !user.verified) {
        return res.status(400).json({ 
          success: false,
          message: 'Contact admin to confirm teacher status',
        });
      }

      // Generate tokens
      const accessTokenJWT = generateAccessToken(user._id);
      const deviceInfo = extractDeviceInfo(req);
      const refreshToken = generateRefreshToken(user._id, deviceInfo);

      // Add refresh token to user
      await user.addRefreshToken({
        token: refreshToken,
        device: deviceInfo.deviceName,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.browser,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Set refresh token in cookie
      setRefreshTokenCookie(res, refreshToken);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Get user without sensitive data
      const userResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        image: user.image,
        isActive: user.isActive,
        facebookId: user.facebookId
      };

      res.status(200).json({
        message: 'Facebook login successful',
        user: userResponse,
        accessToken: accessTokenJWT
      });
    } catch (error) {
      console.error('Facebook API error:', error);
      if (error.response?.status === 400) {
        return res.status(400).json({ message: 'Invalid Facebook access token' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Facebook login error:', error);
    res.status(500).json({ message: 'Facebook authentication failed' });
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters long' 
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a password (not social login only)
    if (!user.password) {
      return res.status(400).json({ 
        message: 'This account uses social login. Password cannot be changed.' 
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  facebookLogin,
  logoutUser,
  logoutAllDevices,
  getProfile,
  refreshAccessToken,
  getUserDevices,
  logoutDevice,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  updatePassword
};