// Script để test tính toán storage trực tiếp với MongoDB
const mongoose = require('mongoose');

// Kết nối đến MongoDB
mongoose.connect('mongodb://localhost:27017/your_database_name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Material = require('./server/models/material.model');
const Assignment = require('./server/models/assignment.model');

const testStorageCalculation = async () => {
  try {
    console.log('Testing Storage Calculation...');
    console.log('===============================');

    // Tính dung lượng từ Materials
    const materialStorageResult = await Material.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $group: { _id: null, totalSize: { $sum: "$fileSize" }, count: { $sum: 1 } } }
    ]);

    // Tính dung lượng từ Assignment attachments
    const assignmentAttachmentsStorage = await Assignment.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $unwind: { path: "$attachments", preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, totalSize: { $sum: "$attachments.fileSize" }, count: { $sum: 1 } } }
    ]);

    // Tính dung lượng từ Assignment submissions
    const submissionAttachmentsStorage = await Assignment.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $unwind: { path: "$submissions", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$submissions.attachments", preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, totalSize: { $sum: "$submissions.attachments.fileSize" }, count: { $sum: 1 } } }
    ]);

    // Hiển thị kết quả
    const materialSize = materialStorageResult[0]?.totalSize || 0;
    const materialCount = materialStorageResult[0]?.count || 0;
    
    const assignmentAttachmentSize = assignmentAttachmentsStorage[0]?.totalSize || 0;
    const assignmentAttachmentCount = assignmentAttachmentsStorage[0]?.count || 0;
    
    const submissionAttachmentSize = submissionAttachmentsStorage[0]?.totalSize || 0;
    const submissionAttachmentCount = submissionAttachmentsStorage[0]?.count || 0;

    console.log(`Materials: ${materialCount} files, ${(materialSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Assignment Attachments: ${assignmentAttachmentCount} files, ${(assignmentAttachmentSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Submission Attachments: ${submissionAttachmentCount} files, ${(submissionAttachmentSize / (1024 * 1024)).toFixed(2)} MB`);

    const totalStorageBytes = materialSize + assignmentAttachmentSize + submissionAttachmentSize;
    const totalStorage = Math.round(totalStorageBytes / (1024 * 1024) * 100) / 100;

    console.log(`\nTotal Storage: ${totalStorage} MB`);
    console.log(`Total Files: ${materialCount + assignmentAttachmentCount + submissionAttachmentCount}`);

  } catch (error) {
    console.error('Error calculating storage:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run test
testStorageCalculation();
