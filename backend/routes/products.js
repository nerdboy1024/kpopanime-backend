const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// ===========================
// GET ALL PRODUCTS (Public)
// ===========================
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            category,
            featured,
            search,
            sort = 'createdAt',
            order = 'desc',
            limit = 20,
            offset = 0
        } = req.query;

        // Start with base query
        let query = db.collection('products').where('isActive', '==', true);

        // Filter by category
        if (category) {
            const categoryDoc = await db.collection('categories')
                .where('slug', '==', category)
                .limit(1)
                .get();

            if (!categoryDoc.empty) {
                const categoryId = categoryDoc.docs[0].id;
                query = query.where('categoryId', '==', categoryId);
            }
        }

        // Filter by featured
        if (featured === 'true') {
            query = query.where('isFeatured', '==', true);
        }

        // Apply sorting
        const validSortFields = ['createdAt', 'name', 'price', 'stockQuantity'];
        const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
        const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
        query = query.orderBy(sortField, sortOrder);

        // Execute query
        const snapshot = await query.get();
        let products = [];

        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Apply search filter (client-side since Firestore doesn't support full-text search)
        if (search) {
            const searchLower = search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                (p.description && p.description.toLowerCase().includes(searchLower))
            );
        }

        // Get total before pagination
        const total = products.length;

        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        products = products.slice(startIndex, endIndex);

        // Fetch category names for products
        for (let product of products) {
            if (product.categoryId) {
                const catDoc = await db.collection('categories').doc(product.categoryId).get();
                if (catDoc.exists) {
                    const catData = catDoc.data();
                    product.categoryName = catData.name;
                    product.categorySlug = catData.slug;
                }
            }
        }

        res.json({
            products,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < total
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to fetch products'
        });
    }
});

// ===========================
// GET SINGLE PRODUCT (Public)
// ===========================
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const snapshot = await db.collection('products')
            .where('slug', '==', slug)
            .where('isActive', '==', true)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Product not found'
            });
        }

        const productDoc = snapshot.docs[0];
        const product = {
            id: productDoc.id,
            ...productDoc.data()
        };

        // Fetch category info
        if (product.categoryId) {
            const catDoc = await db.collection('categories').doc(product.categoryId).get();
            if (catDoc.exists) {
                const catData = catDoc.data();
                product.categoryName = catData.name;
                product.categorySlug = catData.slug;
            }
        }

        res.json({ product });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to fetch product'
        });
    }
});

// ===========================
// CREATE PRODUCT (Admin only)
// ===========================
router.post('/', authenticateToken, requireAdmin,
    [
        body('name').trim().notEmpty(),
        body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/),
        body('description').optional().trim(),
        body('price').isFloat({ min: 0 }),
        body('compareAtPrice').optional().isFloat({ min: 0 }),
        body('stockQuantity').optional().isInt({ min: 0 }),
        body('categoryId').optional().isString(),
        body('imageUrl').optional().isURL(),
        body('isFeatured').optional().isBoolean()
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

            const {
                name,
                slug,
                description,
                price,
                compareAtPrice,
                stockQuantity = 0,
                categoryId,
                imageUrl,
                images = [],
                isFeatured = false,
                metadata = {},
                variants = []
            } = req.body;

            // Check if slug already exists
            const existing = await db.collection('products')
                .where('slug', '==', slug)
                .limit(1)
                .get();

            if (!existing.empty) {
                return res.status(409).json({
                    error: 'ConflictError',
                    message: 'Product with this slug already exists'
                });
            }

            // Create product
            const productData = {
                name,
                slug,
                description: description || '',
                price: parseFloat(price),
                compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
                stockQuantity: parseInt(stockQuantity),
                categoryId: categoryId || null,
                imageUrl: imageUrl || null,
                images: images,
                isFeatured,
                isActive: true,
                metadata,
                variants,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await db.collection('products').add(productData);

            res.status(201).json({
                message: 'Product created successfully',
                product: {
                    id: docRef.id,
                    ...productData
                }
            });
        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({
                error: 'ServerError',
                message: 'Failed to create product'
            });
        }
    }
);

// ===========================
// UPDATE PRODUCT (Admin only)
// ===========================
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const productRef = db.collection('products').doc(id);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Product not found'
            });
        }

        // Build update data
        const allowedFields = [
            'name', 'slug', 'description', 'price', 'compareAtPrice',
            'stockQuantity', 'categoryId', 'imageUrl', 'images',
            'isActive', 'isFeatured', 'metadata', 'variants'
        ];

        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                error: 'ValidationError',
                message: 'No valid fields to update'
            });
        }

        updates.updatedAt = new Date();

        // Update product
        await productRef.update(updates);

        const updated = await productRef.get();

        res.json({
            message: 'Product updated successfully',
            product: {
                id: updated.id,
                ...updated.data()
            }
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to update product'
        });
    }
});

// ===========================
// DELETE PRODUCT (Admin only)
// ===========================
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const productRef = db.collection('products').doc(id);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Product not found'
            });
        }

        // Soft delete (set isActive to false)
        await productRef.update({
            isActive: false,
            updatedAt: new Date()
        });

        res.json({
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to delete product'
        });
    }
});

// ===========================
// BULK DELETE PRODUCTS (Admin only)
// ===========================
router.post('/bulk/delete', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                error: 'ValidationError',
                message: 'productIds must be a non-empty array'
            });
        }

        const batch = db.batch();
        const updatedAt = new Date();

        for (const id of productIds) {
            const productRef = db.collection('products').doc(id);
            batch.update(productRef, { isActive: false, updatedAt });
        }

        await batch.commit();

        res.json({
            message: `${productIds.length} products deleted successfully`
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to delete products'
        });
    }
});

// ===========================
// BULK UPDATE PRODUCTS (Admin only)
// ===========================
router.post('/bulk/update', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { productIds, updates } = req.body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                error: 'ValidationError',
                message: 'productIds must be a non-empty array'
            });
        }

        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({
                error: 'ValidationError',
                message: 'updates must be an object'
            });
        }

        const batch = db.batch();
        updates.updatedAt = new Date();

        for (const id of productIds) {
            const productRef = db.collection('products').doc(id);
            batch.update(productRef, updates);
        }

        await batch.commit();

        res.json({
            message: `${productIds.length} products updated successfully`
        });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to update products'
        });
    }
});

module.exports = router;
