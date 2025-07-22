const Material = require("../models/material.model");
const Classroom = require("../models/classroom.model");
const axios = require("axios");
const { default: mongoose } = require("mongoose");

const getMaterials = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const currentUser = req.user;
    const classroom = await Classroom.findById(classroomId)
      .populate("teacher", "fullName email")
      .populate("students", "fullName email");
    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: "Classroom not found",
        message: "The specified classroom does not exist",
      });
    }
    if (
      currentUser.role === "student" &&
      !classroom.students.some(
        (student) => student._id.toString() === currentUser._id.toString()
      )
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
        message: "You are not enrolled in this classroom",
      });
    }
    const materials = await Material.find({
      classroom: classroomId,
      deleted: false,
      isPublic: true,
    })
      .populate("uploadedBy", "fullName email role")
      .populate("classroom", "name subject")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Materials fetched successfully",
      data: {
        materials: materials.map((material) => ({
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
            role: material.uploadedBy.role,
          },
          classroom: {
            _id: material.classroom._id,
            name: material.classroom.name,
            subject: material.classroom.subject,
          },
          createdAt: material.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch materials. Please try again later.",
    });
  }
};
const shareMaterialToClass = async (req, res) => {
  try {
    const { classroomId } = req.body;
    const { materialId } = req.params;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: "Classroom not found",
        message: "The specified classroom does not exist",
      });
    }

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    if (material.classroom.includes(classroomId)) {
      return res.status(200).json({
        success: false,
        message: `File ${material.title} đã tồn tại trong tài liệu lớp ${classroom.name}!`,
        material,
      });
    }

    const updatedMaterial = await Material.findByIdAndUpdate(
      materialId,
      { $push: { classroom: classroomId } },
      { new: true }
    );

    res.json({
      success: true,
      message: `Đã chia sẻ thành công file ${material.title} cho lớp ${classroom.name}`,
      material: updatedMaterial,
    });
  } catch (error) {
    console.error("Error sharing material to classroom:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to share material. Please try again later.",
    });
  }
};
const getMaterialByTeacher = async (req, res) => {
  try {
    const currentUser = req.user;

    const materials = await Material.find({
      uploadedBy: currentUser._id,
      deleted: false, 
    }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Materials fetched successfully",
      data: {
        materials: materials.map((material) => ({
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
          classroom: material.classroom,
          createdAt: material.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch materials. Please try again later.",
    });
  }
};
const uploadMaterialToLibrary = async (req, res) => {
  try {
    const { title, description, isPublic, tags, sharedWith } = req.body;
    const uploadedFile = req.file;
    const currentUser = req.user;
    const parsedSharedWith = sharedWith ? JSON.parse(sharedWith) : [];
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
        message: "Please select a file to upload",
      });
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Title is required",
        message: "Please provide a title for the material",
      });
    }

    // Parse tags from string to array if needed
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
        parsedTags = Array.isArray(parsedTags)
          ? parsedTags
            .filter((tag) => tag && tag.trim() !== "")
            .map((tag) => tag.trim().toLowerCase())
          : [];
      } catch (error) {
        console.warn("Failed to parse tags:", error);
        parsedTags = [];
      }
    } 
    let validClassroomIds = [];
    if (Array.isArray(parsedSharedWith)) {
      validClassroomIds = parsedSharedWith.filter(id => {
        // Check if it's a valid ObjectId
        if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
          // Additional check: ensure it's exactly 24 hex characters
          if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
            return true;
          }
        }
        return false;
      });
    }
    const materialType = getMaterialType(uploadedFile.mimetype);
    const publicId = extractPublicId(uploadedFile.path);
    const materialData = {
      title: title.trim(),
      description: description ? description.trim() : "",
      type: materialType,
      fileUrl: uploadedFile.path,
      fileSize: uploadedFile.size,
      fileType: uploadedFile.mimetype,
      classroom: validClassroomIds,
      uploadedBy: currentUser._id,
      isPublic: isPublic === "true" || isPublic === true,
      tags: parsedTags,
      cloudinaryPublicId: publicId,
      originalFileName: uploadedFile.originalname,
    };

    const material = new Material(materialData);
    await material.save(); 
    await material.populate("uploadedBy", "fullName email role");
 
    if (validClassroomIds.length > 0) {
      await material.populate("classroom", "name subject");
    }

    res.status(201).json({
      success: true,
      message: "Material uploaded successfully",
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
          version: material.version,
        },
      },
    });

  } catch (error) {
    console.error("Error uploading material:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to upload material. Please try again later.",
    });
  }
};
const uploadMaterial = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { title, description, isPublic, tags } = req.body;
    const uploadedFile = req.file;
    const currentUser = req.user;
    console.log("file uploaded:", uploadedFile);
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
        message: "Please select a file to upload",
      });
    }
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Title is required",
        message: "Please provide a title for the material",
      });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: "Classroom not found",
        message: "The specified classroom does not exist",
      });
    }
    // Check if user is teacher of this classroom (if not admin)
    if (
      currentUser.role === "teacher" &&
      classroom.teacher.toString() !== currentUser._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
        message: "You are not authorized to upload materials to this classroom",
      });
    }
    // Parse tags from string to array if needed
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
        // Ensure it's an array and clean up tags
        parsedTags = Array.isArray(parsedTags)
          ? parsedTags
            .filter((tag) => tag && tag.trim() !== "")
            .map((tag) => tag.trim().toLowerCase())
          : [];
      } catch (error) {
        console.warn("Failed to parse tags:", error);
        parsedTags = [];
      }
    }
    const materialType = getMaterialType(uploadedFile.mimetype);
    const publicId = extractPublicId(uploadedFile.path);
    const materialData = {
      title: title.trim(),
      description: description ? description.trim() : "",
      type: materialType,
      fileUrl: uploadedFile.path, 
      fileSize: uploadedFile.size, 
      fileType: uploadedFile.mimetype,  
      classroom: classroomId,
      uploadedBy: currentUser._id,
      isPublic: isPublic === "true" || isPublic === true,  
      tags: parsedTags,
      // Additional metadata for tracking
      cloudinaryPublicId: publicId,
      originalFileName: uploadedFile.originalname,
    };

    const material = new Material(materialData);
    await material.save();
    // Populate uploadedBy field with user details for response
    await material.populate("uploadedBy", "fullName email role");
    await material.populate("classroom", "name subject");
    res.status(201).json({
      success: true,
      message: "Material uploaded successfully",
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
          version: material.version,
        },
      },
    });
  } catch (error) {
    console.error("Error uploading material:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to upload material. Please try again later.",
    });
  }
};


const deleteMaterial = async (req, res) => {
  try {
    const { classroomId, materialId } = req.params;
    const currentUser = req.user;

    const material = await Material.findById(materialId).populate("classroom");
    if (!material) {
      return res.status(404).json({
        success: false,
        error: "Material not found",
        message: "The specified material does not exist",
      });
    } 
    const canDelete =
      currentUser.role === "admin" ||
      (currentUser.role === "teacher" && material.uploadedBy.toString() === currentUser._id.toString());

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
        message: "You are not authorized to delete this material",
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
      message: "Material deleted successfully",
    });
    console.log(
      `Material deleted: ${material.title} by ${currentUser.fullName}`
    );
  } catch (error) {
    console.error("Error deleting material:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to delete material. Please try again later.",
    });
  }
};
const deleteMaterialFromLibrary = async (req, res) => {
  try {
    const { materialId } = req.params;
    const currentUser = req.user;

    const material = await Material.findById(materialId).populate("classroom");
    if (!material) {
      return res.status(404).json({
        success: false,
        error: "Material not found",
        message: "The specified material does not exist",
      });
    } 
    const canDelete =
      currentUser.role === "admin" ||
      (currentUser.role === "teacher" && material.uploadedBy.toString() === currentUser._id.toString());

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
        message: "You are not authorized to delete this material",
      });
    }
    material.deleted = true;
    material.deletedAt = new Date();
    material.deletedBy = currentUser._id;
    material.isActive = false;
    await material.save();
    res.json({
      success: true,
      message: "Material deleted successfully",
    });
    console.log(
      `Material deleted: ${material.title} by ${currentUser.fullName}`
    );
  } catch (error) {
    console.error("Error deleting material:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to delete material. Please try again later.",
    });
  }
};

function extractPublicId(cloudinaryUrl) {
  const urlParts = cloudinaryUrl.split("/");
  const uploadIndex = urlParts.findIndex((part) => part === "upload");

  if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
    const pathParts = urlParts.slice(uploadIndex + 2);
    const publicId = pathParts.join("/");
    return publicId.replace(/\.[^/.]+$/, "");
  }
  return null;
}
const getMaterialType = (mimeType) => {
  if (mimeType.startsWith("image/")) {
    return "image";
  } else if (mimeType.startsWith("video/")) {
    return "video";
  } else if (mimeType.startsWith("audio/")) {
    return "audio";
  } else if (mimeType === "application/pdf") {
    return "pdf";
  } else if (mimeType.includes("word") || mimeType.includes("document")) {
    return "document";
  } else if (
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint")
  ) {
    return "presentation";
  } else if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return "excel";
  } else if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z")
  ) {
    return "archive";
  } else {
    return "other";
  }
};
const deleteFromCloudinary = async (
  publicId,
  resourceType = null,
  mimeType = null
) => {
  if (!publicId) {
    console.warn("No public ID provided for deletion");
    return null;
  }
  try {
    if (!resourceType && mimeType) {
      resourceType = getResourceTypeFromMimeType(mimeType);
    }
    const typesToTry = resourceType
      ? [resourceType]
      : ["raw", "image", "video"];
    let lastError = null;
    for (const type of typesToTry) {
      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: type,
        });
        // If successful deletion (result is 'ok') or file not found, consider it successful
        if (result.result === "ok" || result.result === "not found") {
          return result;
        }
        lastError = new Error(`Deletion failed with result: ${result.result}`);
      } catch (error) {
        console.warn(`Failed to delete as ${type}:`, error.message);
        lastError = error;
        continue; // Try next resource type
      }
    }
    throw lastError || new Error("All deletion attempts failed");
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
};
const downloadMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const material = await Material.findById(materialId)
      .populate("classroom", "teacher students")
      .populate("uploadedBy", "fullName");

    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }

    const response = await axios({
      method: "GET",
      url: material.fileUrl,
      responseType: "stream",
      timeout: 60000,
    });

    const urlParts = material.fileUrl.split("/");
    const cloudinaryFilename = urlParts[urlParts.length - 1];
    const filename = material.originalFileName || cloudinaryFilename;

    console.log("Download filename:", filename);

    res.setHeader(
      "Content-Type",
      material.fileType || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader("Content-Length", response.headers["content-length"]);
    res.setHeader("Cache-Control", "no-cache");

    // Stream the file
    response.data.pipe(res);

    // Update download count
    material.downloadCount += 1;
    await material.save();
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Download failed" });
  }
};
const updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { title, description, isPublic, tags, sharedWith } = req.body;
    const currentUser = req.user;

    const existingMaterial = await Material.findById(materialId);
    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        error: "Material not found",
        message: "The specified material does not exist",
      });
    }

    if (
      existingMaterial.uploadedBy.toString() !== currentUser._id.toString() &&
      currentUser.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
        message: "You are not authorized to update this material",
      });
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (title && title.trim() !== "") {
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : "";
    }

    if (isPublic !== undefined) {
      updateData.isPublic = isPublic === "true" || isPublic === true;
    }

    if (tags) {
      try {
        let parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
        parsedTags = Array.isArray(parsedTags)
          ? parsedTags
            .filter((tag) => tag && tag.trim() !== "")
            .map((tag) => tag.trim().toLowerCase())
          : [];
        updateData.tags = parsedTags;
      } catch (error) {
        console.warn("Failed to parse tags:", error);
        updateData.tags = existingMaterial.tags;
      }
    }

    if (sharedWith) {
      try {
        let parsedClassroom = typeof sharedWith === "string" ? JSON.parse(sharedWith) : sharedWith;
        if (Array.isArray(parsedClassroom)) {
          // Validate ObjectIds for classroom
          const validClassroomIds = parsedClassroom.filter(id => {
            if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
              if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
                return true;
              }
            }
            return false;
          });
          updateData.classroom = validClassroomIds;
        }
      } catch (error) {
        console.warn("Failed to parse classroom:", error);
      }
    }
 
    if (req.file) {
      const previousVersion = {
        version: existingMaterial.version,
        fileUrl: existingMaterial.fileUrl,
        fileSize: existingMaterial.fileSize,
        fileType: existingMaterial.fileType,
        cloudinaryPublicId: existingMaterial.cloudinaryPublicId,
        updatedAt: existingMaterial.updatedAt || existingMaterial.createdAt,
      };

      updateData.fileUrl = req.file.path;
      updateData.fileSize = req.file.size;
      updateData.fileType = req.file.mimetype;
      updateData.type = getMaterialType(req.file.mimetype);
      updateData.cloudinaryPublicId = extractPublicId(req.file.path);
      updateData.originalFileName = req.file.originalname;
      updateData.version = (existingMaterial.version || 1) + 1;

      const previousVersions = existingMaterial.previousVersions || [];
      updateData.previousVersions = [...previousVersions, previousVersion];
    }
 
    const updatedMaterial = await Material.findByIdAndUpdate(
      materialId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("uploadedBy", "fullName email role")
      .populate("classroom", "name subject");
 
    res.status(200).json({
      success: true,
      message: req.file
        ? "Material and file updated successfully"
        : "Material updated successfully",
      data: {
        material: {
          _id: updatedMaterial._id,
          title: updatedMaterial.title,
          description: updatedMaterial.description,
          type: updatedMaterial.type,
          fileUrl: updatedMaterial.fileUrl,
          fileSize: updatedMaterial.fileSize,
          fileType: updatedMaterial.fileType,
          isPublic: updatedMaterial.isPublic,
          tags: updatedMaterial.tags,
          downloadCount: updatedMaterial.downloadCount,
          viewCount: updatedMaterial.viewCount,
          uploadedBy: updatedMaterial.uploadedBy,
          classroom: updatedMaterial.classroom,
          createdAt: updatedMaterial.createdAt,
          updatedAt: updatedMaterial.updatedAt,
          version: updatedMaterial.version,
        },
      },
    });

  } catch (error) {
    console.error("Error updating material:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to update material. Please try again later.",
    });
  }
};
module.exports = {
  uploadMaterial,
  deleteMaterial,
  getMaterials,
  downloadMaterial,
  getMaterialByTeacher,
  shareMaterialToClass,
  uploadMaterialToLibrary,
  updateMaterial,
  deleteMaterialFromLibrary
};
