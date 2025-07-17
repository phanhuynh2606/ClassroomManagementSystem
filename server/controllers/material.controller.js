const Material = require('../models/material.model');
const Classroom = require('../models/classroom.model');

const getMaterials = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const currentUser = req.user;
        const classroom = await Classroom.findById(classroomId)
            .populate('teacher', 'fullName email')
            .populate('students', 'fullName email');
        if (!classroom) {
            return res.status(404).json({
                success: false,
                error: 'Classroom not found',
                message: 'The specified classroom does not exist'
            });
        }
        if (currentUser.role === 'student' && !classroom.students.some(student => student._id.toString() === currentUser._id.toString())) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                message: 'You are not enrolled in this classroom'
            });
        }
        const materials = await Material.find({ classroom: classroomId, deleted: false })
            .populate('uploadedBy', 'fullName email role')
            .populate('classroom', 'name subject')
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: 'Materials fetched successfully',
            data: {
                materials: materials.map(material => ({
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
                    uploadedBy: {
                        _id: material.uploadedBy._id,
                        fullName: material.uploadedBy.fullName,
                        email: material.uploadedBy.email,
                        role: material.uploadedBy.role
                    },
                    classroom: {
                        _id: material.classroom._id,
                        name: material.classroom.name,
                        subject: material.classroom.subject
                    },
                    createdAt: material.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching materials:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to fetch materials. Please try again later.'
        });
    }
};
const uploadMaterial = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const { title, description, isPublic, tags } = req.body;
        const uploadedFile = req.file;
        const currentUser = req.user;
        console.log('file uploaded:', uploadedFile);
        if (!uploadedFile) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded',
                message: 'Please select a file to upload'
            });
        }
        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Title is required',
                message: 'Please provide a title for the material'
            });
        }
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
        //Determine material type from file if not provided
        const materialType = getMaterialType(uploadedFile.mimetype);

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
                const resourceType = getResourceTypeFromMimeType(req.file.mimetype);
                deleteFromCloudinary(publicId, resourceType, req.file.mimetype).catch(cleanupError => {
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

        const material = await Material.findById(materialId).populate('classroom');
        if (!material) {
            return res.status(404).json({
                success: false,
                error: 'Material not found',
                message: 'The specified material does not exist'
            });
        } 
        if (material.classroom._id.toString() !== classroomId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                message: 'Material does not belong to the specified classroom'
            });
        }

 
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
        material.deleted = true;
        material.deletedAt = new Date();
        material.deletedBy = currentUser._id;
        material.isActive = false;
        await material.save();

        // if (material.cloudinaryPublicId) {
        //     const deleteResult = await deleteFromCloudinary(material.cloudinaryPublicId, 'raw');
        //     if (!deleteResult.success) {
        //         console.warn('Failed to delete file from Cloudinary:', deleteResult.error);
        //     }
        // }

        res.json({
            success: true,
            message: 'Material deleted successfully'
        }); 
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

function extractPublicId(cloudinaryUrl) {
    const urlParts = cloudinaryUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');

    if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
        const pathParts = urlParts.slice(uploadIndex + 2);
        const publicId = pathParts.join('/');
        return publicId.replace(/\.[^/.]+$/, '');
    }
    return null;
}
const getMaterialType = (mimeType) => {
    if (mimeType.startsWith('image/')) {
        return 'image';
    } else if (mimeType.startsWith('video/')) {
        return 'video';
    } else if (mimeType.startsWith('audio/')) {
        return 'audio';
    } else if (mimeType === 'application/pdf') {
        return 'pdf';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
        return 'document';
    } else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
        return 'presentation';
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
        return 'spreadsheet';
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
        return 'archive';
    } else {
        return 'other';
    }
};
const deleteFromCloudinary = async (publicId, resourceType = null, mimeType = null) => {
    if (!publicId) {
        console.warn('No public ID provided for deletion');
        return null;
    }
    try {
        if (!resourceType && mimeType) {
            resourceType = getResourceTypeFromMimeType(mimeType);
        }
        const typesToTry = resourceType ? [resourceType] : ['raw', 'image', 'video'];
        let lastError = null;
        for (const type of typesToTry) {
            try {
                const result = await cloudinary.uploader.destroy(publicId, {
                    resource_type: type
                });
                // If successful deletion (result is 'ok') or file not found, consider it successful
                if (result.result === 'ok' || result.result === 'not found') {
                    return result;
                }
                lastError = new Error(`Deletion failed with result: ${result.result}`);
            } catch (error) {
                console.warn(`Failed to delete as ${type}:`, error.message);
                lastError = error;
                continue; // Try next resource type
            }
        }
        throw lastError || new Error('All deletion attempts failed');
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};
module.exports = {
    uploadMaterial,
    deleteMaterial,
    getMaterials
}