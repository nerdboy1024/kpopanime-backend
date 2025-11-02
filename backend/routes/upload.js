const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs').promises;
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Configure multer storage
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const subdir = req.query.type || 'general';
        const dir = path.join(uploadDir, subdir);
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

// Initialize multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
    }
});

// ===========================
// UPLOAD SINGLE IMAGE
// ===========================
router.post('/image', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'ValidationError',
                message: 'No image file provided'
            });
        }

        const { optimize = 'true', width, height } = req.query;

        let imageUrl = `/uploads/${req.query.type || 'general'}/${req.file.filename}`;

        // Optimize image if requested
        if (optimize === 'true') {
            const outputPath = req.file.path;

            let sharpInstance = sharp(req.file.path);

            // Resize if dimensions provided
            if (width || height) {
                sharpInstance = sharpInstance.resize({
                    width: width ? parseInt(width) : null,
                    height: height ? parseInt(height) : null,
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            // Optimize based on format
            const ext = path.extname(req.file.filename).toLowerCase();
            if (ext === '.jpg' || ext === '.jpeg') {
                await sharpInstance.jpeg({ quality: 85, progressive: true }).toFile(outputPath + '.tmp');
            } else if (ext === '.png') {
                await sharpInstance.png({ compressionLevel: 9 }).toFile(outputPath + '.tmp');
            } else if (ext === '.webp') {
                await sharpInstance.webp({ quality: 85 }).toFile(outputPath + '.tmp');
            } else {
                await sharpInstance.toFile(outputPath + '.tmp');
            }

            // Replace original with optimized
            await fs.rename(outputPath + '.tmp', outputPath);
        }

        // Get file info
        const stats = await fs.stat(req.file.path);

        res.json({
            message: 'Image uploaded successfully',
            image: {
                url: imageUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: stats.size,
                path: req.file.path
            }
        });
    } catch (error) {
        console.error('Upload image error:', error);

        // Clean up file if error occurs
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }

        res.status(500).json({
            error: 'ServerError',
            message: error.message || 'Failed to upload image'
        });
    }
});

// ===========================
// UPLOAD MULTIPLE IMAGES
// ===========================
router.post('/images', authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'ValidationError',
                message: 'No image files provided'
            });
        }

        const images = req.files.map(file => ({
            url: `/uploads/${req.query.type || 'general'}/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        }));

        res.json({
            message: 'Images uploaded successfully',
            images
        });
    } catch (error) {
        console.error('Upload images error:', error);

        // Clean up files if error occurs
        if (req.files) {
            for (const file of req.files) {
                await fs.unlink(file.path).catch(console.error);
            }
        }

        res.status(500).json({
            error: 'ServerError',
            message: error.message || 'Failed to upload images'
        });
    }
});

// ===========================
// DELETE IMAGE
// ===========================
router.delete('/image', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'ValidationError',
                message: 'Image URL is required'
            });
        }

        // Extract path from URL
        const urlPath = url.replace('/uploads/', '');
        const filePath = path.join(uploadDir, urlPath);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Image not found'
            });
        }

        // Delete file
        await fs.unlink(filePath);

        res.json({
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to delete image'
        });
    }
});

// ===========================
// LIST UPLOADED IMAGES
// ===========================
router.get('/images', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { type = 'general' } = req.query;
        const dir = path.join(uploadDir, type);

        try {
            await fs.access(dir);
        } catch (error) {
            return res.json({ images: [] });
        }

        const files = await fs.readdir(dir);

        const images = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(dir, file);
                const stats = await fs.stat(filePath);

                return {
                    url: `/uploads/${type}/${file}`,
                    filename: file,
                    size: stats.size,
                    created: stats.birthtime
                };
            })
        );

        // Sort by creation date, newest first
        images.sort((a, b) => b.created - a.created);

        res.json({ images });
    } catch (error) {
        console.error('List images error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to list images'
        });
    }
});

module.exports = router;
