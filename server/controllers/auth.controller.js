import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Generate access token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1m', // Access token expires in 15 minutes
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
    const { username, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'student'
    });

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

      res.status(201).json({
        message: 'Registration successful',
        user: {
          _id: user._id,
          username: user.username,
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
    });
  } catch (error) {
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
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile fetched successfully',  
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        image: user.image,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        phone: user.phone,
        fullName: user.fullName,
      }
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
        "refreshTokens.isRevoked": false,
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

export {
  registerUser,
  loginUser,
  logoutUser,
  logoutAllDevices,
  getProfile,
  refreshAccessToken
}; 