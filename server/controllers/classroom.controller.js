const Classroom = require("../models/classroom.model");


const getTeacherClassrooms = async (req, res) => {
    try {
        const classrooms = await Classroom.find({ teacher: req.user._id });
        res.status(200).json(classrooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find().populate('teacher', 'fullName');
    res.status(200).json({
      success: true,
      data: classrooms,
    });
  } catch (error) {
    console.error('Error getting classrooms:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classrooms',
    });
  }
};
const deleteClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    await classroom.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Classroom deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting classroom',
    });
  }
};
const createClassroom = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      maxStudents,
      category,
      level,
      schedule,
    } = req.body;


    if (!name || !code || !maxStudents || !category || !level || !schedule) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }


    const existing = await Classroom.findOne({ code });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Class code already exists',
      });
    }


    const newClassroom = await Classroom.create({
      name,
      code,
      description,
      maxStudents,
      category,
      level,
      schedule,
      teacher: req.user._id,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      data: newClassroom,
    });
  } catch (error) {
    console.error('Error creating classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating classroom',
    });
  }
};
const updateClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const {
      name,
      code,
      description,
      maxStudents,
      category,
      level,
      schedule,
      isActive,
      isArchived,
      settings
    } = req.body;


    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }


    if (name !== undefined) classroom.name = name;
    if (code !== undefined) classroom.code = code;
    if (description !== undefined) classroom.description = description;
    if (maxStudents !== undefined) classroom.maxStudents = maxStudents;
    if (category !== undefined) classroom.category = category;
    if (level !== undefined) classroom.level = level;
    if (schedule !== undefined) classroom.schedule = schedule;
    if (isActive !== undefined) classroom.isActive = isActive;
    if (isArchived !== undefined) classroom.isArchived = isArchived;
    if (settings) {
      if (settings.allowStudentInvite !== undefined)
        classroom.settings.allowStudentInvite = settings.allowStudentInvite;
      if (settings.allowStudentPost !== undefined)
        classroom.settings.allowStudentPost = settings.allowStudentPost;
      if (settings.allowStudentComment !== undefined)
        classroom.settings.allowStudentComment = settings.allowStudentComment;
    }

    await classroom.save();

    res.status(200).json({
      success: true,
      message: 'Classroom updated successfully',
      data: classroom,
    });
  } catch (error) {
    console.error('Error updating classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating classroom',
    });
  }
};
module.exports = { getTeacherClassrooms, getAllClassrooms, deleteClassroom, createClassroom, updateClassroom };