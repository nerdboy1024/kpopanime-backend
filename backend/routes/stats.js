const express = require('express');
const router = express.Router();
const { query } = require('../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All stats endpoints require admin access
router.use(authenticateToken, requireAdmin);

// ===========================
// DASHBOARD STATS
// ===========================
router.get('/dashboard', async (req, res) => {
    try {
        // Total products
        const productsResult = await query(
            'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM products'
        );
        const products = productsResult.rows[0];

        // Total orders
        const ordersResult = await query(
            `SELECT
                COUNT(*) as total,
                SUM(total) as revenue,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'processing') as processing,
                COUNT(*) FILTER (WHERE status = 'shipped') as shipped,
                COUNT(*) FILTER (WHERE status = 'delivered') as delivered
             FROM orders`
        );
        const orders = ordersResult.rows[0];

        // Total blog posts
        const blogResult = await query(
            'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_published = true) as published FROM blog_posts'
        );
        const blog = blogResult.rows[0];

        // Total users
        const usersResult = await query(
            'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE role = \'customer\') as customers FROM users'
        );
        const users = usersResult.rows[0];

        // Low stock products
        const lowStockResult = await query(
            'SELECT COUNT(*) as count FROM products WHERE stock_quantity < 5 AND is_active = true'
        );
        const lowStock = parseInt(lowStockResult.rows[0].count);

        // Recent orders (last 7 days)
        const recentOrdersResult = await query(
            `SELECT COUNT(*) as count, SUM(total) as revenue
             FROM orders
             WHERE created_at >= NOW() - INTERVAL '7 days'`
        );
        const recentOrders = recentOrdersResult.rows[0];

        res.json({
            products: {
                total: parseInt(products.total),
                active: parseInt(products.active)
            },
            orders: {
                total: parseInt(orders.total),
                revenue: parseFloat(orders.revenue) || 0,
                pending: parseInt(orders.pending) || 0,
                processing: parseInt(orders.processing) || 0,
                shipped: parseInt(orders.shipped) || 0,
                delivered: parseInt(orders.delivered) || 0
            },
            blog: {
                total: parseInt(blog.total),
                published: parseInt(blog.published)
            },
            users: {
                total: parseInt(users.total),
                customers: parseInt(users.customers)
            },
            alerts: {
                lowStock
            },
            recent: {
                ordersLast7Days: parseInt(recentOrders.count) || 0,
                revenueLast7Days: parseFloat(recentOrders.revenue) || 0
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to fetch dashboard stats'
        });
    }
});

// ===========================
// SALES STATS
// ===========================
router.get('/sales', async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        let interval = '30 days';
        let groupBy = 'DATE(created_at)';

        if (period === '7d') {
            interval = '7 days';
        } else if (period === '90d') {
            interval = '90 days';
        } else if (period === '1y') {
            interval = '1 year';
            groupBy = 'DATE_TRUNC(\'month\', created_at)';
        }

        const result = await query(
            `SELECT
                ${groupBy} as date,
                COUNT(*) as order_count,
                SUM(total) as revenue,
                AVG(total) as avg_order_value
             FROM orders
             WHERE created_at >= NOW() - INTERVAL '${interval}'
             GROUP BY ${groupBy}
             ORDER BY date ASC`
        );

        res.json({
            period,
            data: result.rows.map(row => ({
                date: row.date,
                orderCount: parseInt(row.order_count),
                revenue: parseFloat(row.revenue),
                avgOrderValue: parseFloat(row.avg_order_value)
            }))
        });
    } catch (error) {
        console.error('Sales stats error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to fetch sales stats'
        });
    }
});

// ===========================
// TOP PRODUCTS
// ===========================
router.get('/top-products', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const result = await query(
            `SELECT
                p.id,
                p.name,
                p.price,
                p.image_url,
                SUM(oi.quantity) as units_sold,
                SUM(oi.subtotal) as revenue
             FROM products p
             JOIN order_items oi ON p.id = oi.product_id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.status != 'cancelled'
             GROUP BY p.id, p.name, p.price, p.image_url
             ORDER BY units_sold DESC
             LIMIT $1`,
            [parseInt(limit)]
        );

        res.json({
            products: result.rows.map(row => ({
                id: row.id,
                name: row.name,
                price: parseFloat(row.price),
                imageUrl: row.image_url,
                unitsSold: parseInt(row.units_sold),
                revenue: parseFloat(row.revenue)
            }))
        });
    } catch (error) {
        console.error('Top products error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to fetch top products'
        });
    }
});

// ===========================
// CUSTOMER STATS
// ===========================
router.get('/customers', async (req, res) => {
    try {
        // Total customers
        const totalResult = await query(
            'SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE user_id IS NOT NULL'
        );

        // New customers this month
        const newResult = await query(
            `SELECT COUNT(DISTINCT user_id) as count
             FROM orders
             WHERE user_id IS NOT NULL
             AND created_at >= DATE_TRUNC('month', NOW())`
        );

        // Repeat customers
        const repeatResult = await query(
            `SELECT COUNT(*) as count
             FROM (
                 SELECT user_id
                 FROM orders
                 WHERE user_id IS NOT NULL
                 GROUP BY user_id
                 HAVING COUNT(*) > 1
             ) AS repeat_customers`
        );

        // Average order value
        const avgOrderResult = await query(
            'SELECT AVG(total) as avg_value FROM orders'
        );

        res.json({
            totalCustomers: parseInt(totalResult.rows[0].count),
            newThisMonth: parseInt(newResult.rows[0].count),
            repeatCustomers: parseInt(repeatResult.rows[0].count),
            avgOrderValue: parseFloat(avgOrderResult.rows[0].avg_value) || 0
        });
    } catch (error) {
        console.error('Customer stats error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to fetch customer stats'
        });
    }
});

// ===========================
// INVENTORY STATS
// ===========================
router.get('/inventory', async (req, res) => {
    try {
        // Total inventory value
        const valueResult = await query(
            'SELECT SUM(price * stock_quantity) as total_value FROM products WHERE is_active = true'
        );

        // Low stock items (less than 5)
        const lowStockResult = await query(
            `SELECT id, name, stock_quantity, price
             FROM products
             WHERE stock_quantity < 5 AND is_active = true
             ORDER BY stock_quantity ASC`
        );

        // Out of stock items
        const outOfStockResult = await query(
            `SELECT id, name, price
             FROM products
             WHERE stock_quantity = 0 AND is_active = true`
        );

        // Category distribution
        const categoryResult = await query(
            `SELECT c.name, COUNT(p.id) as product_count
             FROM categories c
             LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
             GROUP BY c.name
             ORDER BY product_count DESC`
        );

        res.json({
            totalValue: parseFloat(valueResult.rows[0].total_value) || 0,
            lowStock: lowStockResult.rows,
            outOfStock: outOfStockResult.rows,
            categoryDistribution: categoryResult.rows
        });
    } catch (error) {
        console.error('Inventory stats error:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to fetch inventory stats'
        });
    }
});

module.exports = router;
