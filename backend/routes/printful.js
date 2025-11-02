/**
 * Printful Routes
 *
 * Handles product syncing and order fulfillment with Printful
 */

const express = require('express');
const router = express.Router();
const { printfulService } = require('../config/printful');
const { admin, db } = require('../config/firebase');

/**
 * Sync products from Printful to Firestore
 * POST /api/printful/sync-products
 */
router.post('/sync-products', async (req, res) => {
    try {
        console.log('Starting Printful product sync...');

        // Get all products from Printful store
        const productsResponse = await printfulService.getStoreProducts();
        const printfulProducts = productsResponse.result || [];

        console.log(`Found ${printfulProducts.length} Printful products`);

        const syncedProducts = [];
        const errors = [];

        // Process each product
        for (const printfulProduct of printfulProducts) {
            try {
                // Get detailed product information
                const detailsResponse = await printfulService.getProductDetails(printfulProduct.id);
                const productDetails = detailsResponse.result;

                // Get the sync product (contains variants)
                const syncProduct = productDetails.sync_product;
                const syncVariants = productDetails.sync_variants || [];

                // Process each variant as a separate product
                for (const variant of syncVariants) {
                    try {
                        // Map Printful data to our product schema
                        const product = {
                            name: `${syncProduct.name} - ${variant.name}`,
                            slug: generateSlug(`${syncProduct.name} ${variant.name}`),
                            description: syncProduct.description || '',
                            price: parseFloat(variant.retail_price) || 0,
                            compareAtPrice: 0,
                            stock: 999, // Printful handles inventory
                            category: 'Print-on-Demand',
                            images: variant.files
                                ? variant.files
                                    .filter(f => f.type === 'preview')
                                    .map(f => f.preview_url)
                                : [],
                            sku: variant.sku || `PRINTFUL-${variant.id}`,
                            isActive: true,
                            isPrintful: true,
                            printfulSyncProductId: syncProduct.id,
                            printfulSyncVariantId: variant.id,
                            printfulProductId: variant.product?.product_id,
                            printfulVariantId: variant.product?.variant_id,
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        };

                        // Check if product already exists by printfulSyncVariantId
                        const existingQuery = await db.collection('products')
                            .where('printfulSyncVariantId', '==', variant.id)
                            .limit(1)
                            .get();

                        if (!existingQuery.empty) {
                            // Update existing product
                            const docId = existingQuery.docs[0].id;
                            await db.collection('products').doc(docId).update({
                                ...product,
                                createdAt: existingQuery.docs[0].data().createdAt // Preserve original creation date
                            });
                            console.log(`Updated: ${product.name}`);
                        } else {
                            // Create new product
                            await db.collection('products').add(product);
                            console.log(`Created: ${product.name}`);
                        }

                        syncedProducts.push(product.name);

                    } catch (variantError) {
                        console.error(`Error processing variant ${variant.id}:`, variantError);
                        errors.push({
                            variant: variant.name,
                            error: variantError.message
                        });
                    }
                }

            } catch (productError) {
                console.error(`Error processing product ${printfulProduct.id}:`, productError);
                errors.push({
                    product: printfulProduct.id,
                    error: productError.message
                });
            }
        }

        console.log('Printful sync completed');

        res.json({
            success: true,
            message: `Successfully synced ${syncedProducts.length} products`,
            syncedCount: syncedProducts.length,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error syncing Printful products:', error);
        res.status(500).json({
            success: false,
            error: 'SYNC_FAILED',
            message: error.message
        });
    }
});

/**
 * Submit order to Printful after payment confirmation
 * POST /api/printful/submit-order
 */
router.post('/submit-order', async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: 'ORDER_ID_REQUIRED',
                message: 'Order ID is required'
            });
        }

        // Get order from Firestore
        const orderDoc = await db.collection('orders').doc(orderId).get();

        if (!orderDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'ORDER_NOT_FOUND',
                message: 'Order not found'
            });
        }

        const order = orderDoc.data();

        // Check if order has already been submitted to Printful
        if (order.printfulOrderId) {
            return res.json({
                success: true,
                message: 'Order already submitted to Printful',
                printfulOrderId: order.printfulOrderId
            });
        }

        // Filter Printful items
        const printfulItems = [];
        for (const item of order.items) {
            const productDoc = await db.collection('products').doc(item.productId).get();
            const product = productDoc.data();

            if (product && product.isPrintful) {
                printfulItems.push({
                    sync_variant_id: product.printfulSyncVariantId,
                    quantity: item.quantity,
                    retail_price: item.price.toFixed(2)
                });
            }
        }

        // If no Printful items, skip
        if (printfulItems.length === 0) {
            return res.json({
                success: true,
                message: 'No Printful items in order'
            });
        }

        // Prepare Printful order data
        const printfulOrderData = {
            recipient: {
                name: `${order.customer.firstName} ${order.customer.lastName}`,
                address1: order.shippingAddress.address1,
                address2: order.shippingAddress.address2 || '',
                city: order.shippingAddress.city,
                state_code: order.shippingAddress.state,
                country_code: order.shippingAddress.country || 'US',
                zip: order.shippingAddress.zip,
                phone: order.customer.phone || '',
                email: order.customer.email
            },
            items: printfulItems,
            retail_costs: {
                currency: 'USD',
                subtotal: order.subtotal.toFixed(2),
                shipping: order.shipping.toFixed(2),
                tax: order.tax.toFixed(2),
                total: order.total.toFixed(2)
            }
        };

        // Submit order to Printful
        const printfulResponse = await printfulService.createOrder(printfulOrderData);
        const printfulOrder = printfulResponse.result;

        // Update order in Firestore with Printful order ID
        await db.collection('orders').doc(orderId).update({
            printfulOrderId: printfulOrder.id,
            printfulOrderStatus: printfulOrder.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Order ${orderId} submitted to Printful: ${printfulOrder.id}`);

        res.json({
            success: true,
            message: 'Order submitted to Printful successfully',
            printfulOrderId: printfulOrder.id,
            printfulOrderStatus: printfulOrder.status
        });

    } catch (error) {
        console.error('Error submitting order to Printful:', error);
        res.status(500).json({
            success: false,
            error: 'SUBMIT_FAILED',
            message: error.message
        });
    }
});

/**
 * Get Printful order status
 * GET /api/printful/order-status/:orderId
 */
router.get('/order-status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        // Get order from Firestore
        const orderDoc = await db.collection('orders').doc(orderId).get();

        if (!orderDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'ORDER_NOT_FOUND',
                message: 'Order not found'
            });
        }

        const order = orderDoc.data();

        if (!order.printfulOrderId) {
            return res.json({
                success: true,
                message: 'Order not submitted to Printful',
                hasPrintfulOrder: false
            });
        }

        // Get status from Printful
        const statusResponse = await printfulService.getOrderStatus(order.printfulOrderId);
        const printfulOrder = statusResponse.result;

        // Update local order status
        await db.collection('orders').doc(orderId).update({
            printfulOrderStatus: printfulOrder.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({
            success: true,
            printfulOrderId: order.printfulOrderId,
            status: printfulOrder.status,
            shipments: printfulOrder.shipments || []
        });

    } catch (error) {
        console.error('Error getting Printful order status:', error);
        res.status(500).json({
            success: false,
            error: 'STATUS_FETCH_FAILED',
            message: error.message
        });
    }
});

/**
 * Helper function to generate slug from name
 */
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

module.exports = router;
