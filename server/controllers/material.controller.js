const Material = require('../models/material.model');
const Classrom = require('../models/classroom.model');

const uploadMaterial = async (req, res) => {
    try { 
        const { classroomId } = req.params; // Get classroomId from URL params
        const { title, description, type, isPublic, tags } = req.body; // Get form data
        const uploadedFile = req.file; // File from multer middleware
        const currentUser = req.user; // User from auth middleware 
        // Check if file was uploaded
        if (!uploadedFile) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded',
                message: 'Please select a file to upload'
            });
        } 
        // Validate required fields
        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Title is required',
                message: 'Please provide a title for the material'
            });
        } 
        // Validate classroom exists and user has permission
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({
                success: false,
                error: 'Classroom not found',
                message: 'The specified classroom does not exist'
            });
        } 
        // Check if user is teacher of this classroom (if not admin)
        if (currentUser.role === 'teacher' && classroom.teacher.toString() !== currentUser._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: 'You are not authorized to upload materials to this classroom'
            });
        } 
        // Parse tags from string to array if needed
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
                // Ensure it's an array and clean up tags
                parsedTags = Array.isArray(parsedTags)
                    ? parsedTags.filter(tag => tag && tag.trim() !== '').map(tag => tag.trim().toLowerCase())
                    : [];
            } catch (error) {
                console.warn('Failed to parse tags:', error);
                parsedTags = [];
            }
        } 
        // Determine material type from file if not provided
        const materialType = type || getMaterialType(uploadedFile.mimetype);

        // Extract public ID from Cloudinary URL for future reference
        const publicId = extractPublicId(uploadedFile.path); 
        const materialData = {
            title: title.trim(),
            description: description ? description.trim() : '',
            type: materialType,
            fileUrl: uploadedFile.path, // Cloudinary URL
            fileSize: uploadedFile.size, // File size in bytes
            fileType: uploadedFile.mimetype, // MIME type
            classroom: classroomId,
            uploadedBy: currentUser._id,
            isPublic: isPublic === 'true' || isPublic === true, // Convert string to boolean
            tags: parsedTags,
            // Additional metadata for tracking
            cloudinaryPublicId: publicId,
            originalFileName: uploadedFile.originalname
        }; 
 
        const material = new Material(materialData);
        await material.save(); 
        // Populate uploadedBy field with user details for response
        await material.populate('uploadedBy', 'fullName email role');
        await material.populate('classroom', 'name subject'); 
        res.status(201).json({
            success: true,
            message: 'Material uploaded successfully',
            data: {
                material: {
                    _id: material._id,
                    title: material.title,
                    description: material.description,
                    type: material.type,
                    fileUrl: material.fileUrl,
                    fileSize: material.fileSize,
                    fileType: material.fileType,
                    isPublic: material.isPublic,
                    tags: material.tags,
                    downloadCount: material.downloadCount,
                    viewCount: material.viewCount,
                    uploadedBy: material.uploadedBy,
                    classroom: material.classroom,
                    createdAt: material.createdAt,
                    version: material.version
                }
            }
        });  
    } catch (error) {
        console.error('Error uploading material:', error); 
        if (req.file && req.file.path) {
            const publicId = extractPublicId(req.file.path);
            if (publicId) {
                deleteFromCloudinary(publicId, 'raw').catch(cleanupError => {
                    console.error('Failed to cleanup uploaded file:', cleanupError);
                });
            }
        } 
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                message: error.message,
                details: error.errors
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to upload material. Please try again later.'
        });
    }
};

const deleteMaterial = async (req, res) => {
    try {
        const { classroomId, materialId } = req.params;
        const currentUser = req.user;

        // Find the material
        const material = await Material.findById(materialId).populate('classroom');
        if (!material) {
            return res.status(404).json({
                success: false,
                error: 'Material not found',
                message: 'The specified material does not exist'
            });
        }

        // Check if material belongs to the specified classroom
        if (material.classroom._id.toString() !== classroomId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                message: 'Material does not belong to the specified classroom'
            });
        }

        // Check permissions
        const canDelete = currentUser.role === 'admin' || 
                         (currentUser.role === 'teacher' && material.classroom.teacher.toString() === currentUser._id.toString()) ||
                         material.uploadedBy.toString() === currentUser._id.toString();

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: 'You are not authorized to delete this material'
            });
        }

        // Perform soft delete
        material.deleted = true;
        material.deletedAt = new Date();
        material.deletedBy = currentUser._id;
        material.isActive = false;
        await material.save();

        // Optional: Delete from Cloudinary (uncomment if you want permanent deletion)
        /*
        if (material.cloudinaryPublicId) {
            const deleteResult = await deleteFromCloudinary(material.cloudinaryPublicId, 'raw');
            if (!deleteResult.success) {
                console.warn('Failed to delete file from Cloudinary:', deleteResult.error);
            }
        }
        */

        res.json({
            success: true,
            message: 'Material deleted successfully'
        });

        // Log deletion for audit trail
        console.log(`Material deleted: ${material.title} by ${currentUser.fullName}`);

    } catch (error) {
        console.error('Error deleting material:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to delete material. Please try again later.'
        });
    }
};
module.exports = {
    uploadMaterial,
    deleteMaterial
}