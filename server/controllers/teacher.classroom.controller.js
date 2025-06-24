const Classroom = require("../models/classroom.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const Request = require("../models/request.model");

// Helper function to send notification
const sendNotification = async (title, content, type, sender, recipients, classroom = null) => {
  try {
    const notification = new Notification({
      title,
      content,
      type,
      sender,
      recipients: recipients.map(recipient => ({ user: recipient })),
      classroom,
      action: 'announcement'
    });
    await notification.save();
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Appearance/Background Management APIs

const updateClassroomAppearance = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { background, header, customCss } = req.body;

    // Find classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check authorization - only teacher of the classroom can update appearance
    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this classroom appearance'
      });
    }

    // Initialize appearance object if it doesn't exist
    if (!classroom.appearance) {
      classroom.appearance = {};
    }

    // Update background settings
    if (background) {
      await classroom.setBackground(background);
    }

    // Update header settings
    if (header) {
      if (!classroom.appearance.header) {
        classroom.appearance.header = {};
      }
      Object.assign(classroom.appearance.header, header);
    }

    // Update custom CSS
    if (customCss !== undefined) {
      classroom.appearance.customCss = customCss;
    }

    await classroom.save();

    // Get background style for response
    const backgroundStyle = classroom.getBackgroundStyle();

    res.status(200).json({
      success: true,
      message: 'Classroom appearance updated successfully',
      data: {
        appearance: classroom.appearance,
        backgroundStyle: backgroundStyle
      }
    });

  } catch (error) {
    console.error('Error updating classroom appearance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating appearance'
    });
  }
};

const getClassroomAppearance = async (req, res) => {
  try {
    const { classroomId } = req.params;

    // Find classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check authorization
    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this classroom appearance'
      });
    }

    // Get background style
    const backgroundStyle = classroom.getBackgroundStyle();

    res.status(200).json({
      success: true,
      data: {
        appearance: classroom.appearance || {},
        backgroundStyle: backgroundStyle
      }
    });

  } catch (error) {
    console.error('Error fetching classroom appearance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appearance'
    });
  }
};

const resetClassroomAppearance = async (req, res) => {
  try {
    const { classroomId } = req.params;

    // Find classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check authorization
    if (classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reset this classroom appearance'
      });
    }

    // Reset to default appearance
    await classroom.resetToDefaultAppearance();

    // Get background style for response
    const backgroundStyle = classroom.getBackgroundStyle();

    res.status(200).json({
      success: true,
      message: 'Classroom appearance reset to default successfully',
      data: {
        appearance: classroom.appearance,
        backgroundStyle: backgroundStyle
      }
    });

  } catch (error) {
    console.error('Error resetting classroom appearance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting appearance'
    });
  }
};

const getAvailableThemes = async (req, res) => {
  try {
    // Get available themes from classroom model
    const themes = Classroom.getAvailableThemes();

    res.status(200).json({
      success: true,
      data: themes
    });

  } catch (error) {
    console.error('Error fetching available themes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching themes'
    });
  }
};

const uploadBackgroundImage = async (req, res) => {
  try {
    // Check if file was uploaded through middleware
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    // File has already been uploaded to Cloudinary by middleware
    // req.file contains the Cloudinary information
    const { path: imageUrl, filename, originalname, size, mimetype } = req.file;

    res.status(200).json({
      success: true,
      message: 'Background image uploaded successfully',
      data: {
        url: imageUrl, // This is the Cloudinary secure_url from middleware
        filename: filename,
        originalName: originalname,
        size: size,
        mimetype: mimetype
      }
    });

  } catch (error) {
    console.error('Error processing background image upload:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing image upload'
    });
  }
};


module.exports = {
  
  // Appearance Management
  updateClassroomAppearance,
  getClassroomAppearance,
  resetClassroomAppearance,
  getAvailableThemes,
  uploadBackgroundImage
};
