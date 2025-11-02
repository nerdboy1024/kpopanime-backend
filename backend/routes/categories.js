const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ===========================
// GET ALL CATEGORIES (Public)
// ===========================
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('categories')
            .orderBy('name', 'asc')
            .get();

        const categories = [];
        snapshot.forEach(doc => {
            categories.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to fetch categories'
        });
    }
});

// ===========================
// GET SINGLE CATEGORY (Public)
// ===========================
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const snapshot = await db.collection('categories')
            .where('slug', '==', slug)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Category not found'
            });
        }

        const categoryDoc = snapshot.docs[0];
        const category = {
            id: categoryDoc.id,
            ...categoryDoc.data()
        };

        res.json({ category });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to fetch category'
        });
    }
});

// ===========================
// CREATE CATEGORY (Admin only)
// ===========================
router.post('/', authenticateToken, requireAdmin,
    [
        body('name').trim().notEmpty(),
        body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/),
        body('description').optional().trim(),
        body('icon').optional().trim()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'ValidationError',
                    message: 'Invalid input',
                    errors: errors.array()
                });
            }

            const { name, slug, description, icon } = req.body;

            // Check if slug already exists
            const existing = await db.collection('categories')
                .where('slug', '==', slug)
                .limit(1)
                .get();

            if (!existing.empty) {
                return res.status(409).json({
                    error: 'ConflictError',
                    message: 'Category with this slug already exists'
                });
            }

            const categoryData = {
                name,
                slug,
                description: description || '',
                icon: icon || '',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await db.collection('categories').add(categoryData);

            res.status(201).json({
                message: 'Category created successfully',
                category: {
                    id: docRef.id,
                    ...categoryData
                }
            });
        } catch (error) {
            console.error('Create category error:', error);
            res.status(500).json({
                error: 'ServerError',
                message: 'Failed to create category'
            });
        }
    }
);

// ===========================
// UPDATE CATEGORY (Admin only)
// ===========================
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const categoryRef = db.collection('categories').doc(id);
        const categoryDoc = await categoryRef.get();

        if (!categoryDoc.exists) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Category not found'
            });
        }

        const { name, slug, description, icon } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (slug !== undefined) updates.slug = slug;
        if (description !== undefined) updates.description = description;
        if (icon !== undefined) updates.icon = icon;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                error: 'ValidationError',
                message: 'No fields to update'
            });
        }

        updates.updatedAt = new Date();

        await categoryRef.update(updates);

        const updated = await categoryRef.get();

        res.json({
            message: 'Category updated successfully',
            category: {
                id: updated.id,
                ...updated.data()
            }
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to update category'
        });
    }
});

// ===========================
// DELETE CATEGORY (Admin only)
// ===========================
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const categoryRef = db.collection('categories').doc(id);
        const categoryDoc = await categoryRef.get();

        if (!categoryDoc.exists) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Category not found'
            });
        }

        await categoryRef.delete();

        res.json({
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to delete category'
        });
    }
});

module.exports = router;
