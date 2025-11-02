const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// ===========================
// GET ALL BLOG POSTS (Public - published only)
// ===========================
router.get('/', async (req, res) => {
    try {
        const {
            category,
            search,
            limit = 10,
            offset = 0
        } = req.query;

        let postsQuery = db.collection('blog_posts')
            .where('isPublished', '==', true);

        // Apply category filter
        if (category) {
            postsQuery = postsQuery.where('category', '==', category);
        }

        // Order by publishedAt descending
        postsQuery = postsQuery.orderBy('publishedAt', 'desc');

        // Get all matching documents for pagination
        const snapshot = await postsQuery.get();

        // Filter by search if provided (client-side filtering since Firestore doesn't have ILIKE)
        let posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            publishedAt: doc.data().publishedAt?.toDate()
        }));

        if (search) {
            const searchLower = search.toLowerCase();
            posts = posts.filter(post =>
                post.title?.toLowerCase().includes(searchLower) ||
                post.content?.toLowerCase().includes(searchLower)
            );
        }

        const total = posts.length;
        const paginatedPosts = posts.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        // Fetch author information for each post
        const postsWithAuthors = await Promise.all(paginatedPosts.map(async (post) => {
            if (post.authorId) {
                const authorDoc = await db.collection('users').doc(post.authorId).get();
                if (authorDoc.exists) {
                    const authorData = authorDoc.data();
                    return {
                        ...post,
                        author_first_name: authorData.displayName?.split(' ')[0] || '',
                        author_last_name: authorData.displayName?.split(' ').slice(1).join(' ') || ''
                    };
                }
            }
            return post;
        }));

        res.json({
            posts: postsWithAuthors,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < total
            }
        });
    } catch (error) {
        console.error('Get blog posts error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to fetch blog posts'
        });
    }
});

// ===========================
// GET ALL POSTS (Admin - including unpublished)
// ===========================
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const snapshot = await db.collection('blog_posts')
            .orderBy('createdAt', 'desc')
            .get();

        const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            publishedAt: doc.data().publishedAt?.toDate()
        }));

        const total = posts.length;
        const paginatedPosts = posts.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        // Fetch author information for each post
        const postsWithAuthors = await Promise.all(paginatedPosts.map(async (post) => {
            if (post.authorId) {
                const authorDoc = await db.collection('users').doc(post.authorId).get();
                if (authorDoc.exists) {
                    const authorData = authorDoc.data();
                    return {
                        ...post,
                        author_first_name: authorData.displayName?.split(' ')[0] || '',
                        author_last_name: authorData.displayName?.split(' ').slice(1).join(' ') || ''
                    };
                }
            }
            return post;
        }));

        res.json({
            posts: postsWithAuthors,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Get all blog posts error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to fetch blog posts'
        });
    }
});

// ===========================
// GET SINGLE BLOG POST (Public)
// ===========================
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const snapshot = await db.collection('blog_posts')
            .where('slug', '==', slug)
            .where('isPublished', '==', true)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Blog post not found'
            });
        }

        const postDoc = snapshot.docs[0];
        const post = {
            id: postDoc.id,
            ...postDoc.data(),
            createdAt: postDoc.data().createdAt?.toDate(),
            updatedAt: postDoc.data().updatedAt?.toDate(),
            publishedAt: postDoc.data().publishedAt?.toDate()
        };

        // Fetch author information
        if (post.authorId) {
            const authorDoc = await db.collection('users').doc(post.authorId).get();
            if (authorDoc.exists) {
                const authorData = authorDoc.data();
                post.author_first_name = authorData.displayName?.split(' ')[0] || '';
                post.author_last_name = authorData.displayName?.split(' ').slice(1).join(' ') || '';
            }
        }

        res.json({ post });
    } catch (error) {
        console.error('Get blog post error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to fetch blog post'
        });
    }
});

// ===========================
// CREATE BLOG POST (Admin only)
// ===========================
router.post('/', authenticateToken, requireAdmin,
    [
        body('title').trim().notEmpty(),
        body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/),
        body('content').notEmpty(),
        body('excerpt').optional().trim(),
        body('category').optional().trim(),
        body('featuredImage').optional().isURL(),
        body('readTime').optional().isInt({ min: 1 }),
        body('isPublished').optional().isBoolean(),
        body('tags').optional().isArray()
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
                title,
                slug,
                content,
                excerpt,
                category,
                featuredImage,
                readTime = 5,
                isPublished = false,
                tags = [],
                metadata = {}
            } = req.body;

            // Check if slug exists
            const existingSnapshot = await db.collection('blog_posts')
                .where('slug', '==', slug)
                .limit(1)
                .get();

            if (!existingSnapshot.empty) {
                return res.status(409).json({
                    error: 'ConflictError',
                    message: 'Blog post with this slug already exists'
                });
            }

            const now = new Date();
            const publishedAt = isPublished ? now : null;

            const postData = {
                title,
                slug,
                content,
                excerpt: excerpt || null,
                category: category || null,
                featuredImage: featuredImage || null,
                authorId: req.user.uid,
                readTime,
                isPublished,
                publishedAt,
                tags,
                metadata,
                createdAt: now,
                updatedAt: now
            };

            const docRef = await db.collection('blog_posts').add(postData);
            const newPost = {
                id: docRef.id,
                ...postData
            };

            res.status(201).json({
                message: 'Blog post created successfully',
                post: newPost
            });
        } catch (error) {
            console.error('Create blog post error:', error);
            res.status(500).json({
                error: 'ServerError',
                message: 'Failed to create blog post'
            });
        }
    }
);

// ===========================
// UPDATE BLOG POST (Admin only)
// ===========================
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const allowedFields = [
            'title', 'slug', 'content', 'excerpt', 'category', 'featuredImage',
            'readTime', 'isPublished', 'publishedAt', 'tags', 'metadata'
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

        // If publishing for first time, set publishedAt
        if (req.body.isPublished && !req.body.publishedAt) {
            const postDoc = await db.collection('blog_posts').doc(id).get();
            if (postDoc.exists && !postDoc.data().isPublished) {
                updates.publishedAt = new Date();
            }
        }

        updates.updatedAt = new Date();

        await db.collection('blog_posts').doc(id).update(updates);

        const updatedDoc = await db.collection('blog_posts').doc(id).get();

        if (!updatedDoc.exists) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Blog post not found'
            });
        }

        const post = {
            id: updatedDoc.id,
            ...updatedDoc.data(),
            createdAt: updatedDoc.data().createdAt?.toDate(),
            updatedAt: updatedDoc.data().updatedAt?.toDate(),
            publishedAt: updatedDoc.data().publishedAt?.toDate()
        };

        res.json({
            message: 'Blog post updated successfully',
            post
        });
    } catch (error) {
        console.error('Update blog post error:', error);

        if (error.code === 5) { // NOT_FOUND error code in Firestore
            return res.status(404).json({
                error: 'NotFound',
                message: 'Blog post not found'
            });
        }

        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to update blog post'
        });
    }
});

// ===========================
// DELETE BLOG POST (Admin only)
// ===========================
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const postDoc = await db.collection('blog_posts').doc(id).get();

        if (!postDoc.exists) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Blog post not found'
            });
        }

        await db.collection('blog_posts').doc(id).delete();

        res.json({
            message: 'Blog post deleted successfully'
        });
    } catch (error) {
        console.error('Delete blog post error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to delete blog post'
        });
    }
});

module.exports = router;
