/**
 * Printful API Configuration
 *
 * Handles connection to Printful's print-on-demand API
 * for product sync and order fulfillment
 */

const axios = require('axios');

// Printful API Configuration
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY || '';
const PRINTFUL_API_BASE = 'https://api.printful.com';

/**
 * Create axios instance with Printful authentication
 */
const printfulAPI = axios.create({
    baseURL: PRINTFUL_API_BASE,
    headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

/**
 * Printful API Service
 */
class PrintfulService {
    /**
     * Get all products from Printful store
     */
    async getStoreProducts() {
        try {
            const response = await printfulAPI.get('/store/products');
            return response.data;
        } catch (error) {
            console.error('Error fetching Printful products:', error.response?.data || error.message);
            throw new Error(`Failed to fetch Printful products: ${error.message}`);
        }
    }

    /**
     * Get detailed information about a specific product
     */
    async getProductDetails(productId) {
        try {
            const response = await printfulAPI.get(`/store/products/${productId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching product details:', error.response?.data || error.message);
            throw new Error(`Failed to fetch product details: ${error.message}`);
        }
    }

    /**
     * Get variant information
     */
    async getVariant(variantId) {
        try {
            const response = await printfulAPI.get(`/store/variants/${variantId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching variant:', error.response?.data || error.message);
            throw new Error(`Failed to fetch variant: ${error.message}`);
        }
    }

    /**
     * Create an order in Printful
     */
    async createOrder(orderData) {
        try {
            const response = await printfulAPI.post('/orders', orderData);
            return response.data;
        } catch (error) {
            console.error('Error creating Printful order:', error.response?.data || error.message);
            throw new Error(`Failed to create Printful order: ${error.message}`);
        }
    }

    /**
     * Get order status from Printful
     */
    async getOrderStatus(orderId) {
        try {
            const response = await printfulAPI.get(`/orders/${orderId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching order status:', error.response?.data || error.message);
            throw new Error(`Failed to fetch order status: ${error.message}`);
        }
    }

    /**
     * Estimate shipping costs
     */
    async estimateShipping(orderData) {
        try {
            const response = await printfulAPI.post('/shipping/rates', orderData);
            return response.data;
        } catch (error) {
            console.error('Error estimating shipping:', error.response?.data || error.message);
            throw new Error(`Failed to estimate shipping: ${error.message}`);
        }
    }
}

module.exports = {
    printfulAPI,
    printfulService: new PrintfulService(),
    PRINTFUL_API_KEY
};
