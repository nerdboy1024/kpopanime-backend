const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const config = {
    host: process.env.NODE_ENV === 'production'
        ? process.env.PROD_DB_HOST
        : process.env.DB_HOST,
    port: process.env.NODE_ENV === 'production'
        ? process.env.PROD_DB_PORT
        : process.env.DB_PORT,
    database: process.env.NODE_ENV === 'production'
        ? process.env.PROD_DB_NAME
        : process.env.DB_NAME,
    user: process.env.NODE_ENV === 'production'
        ? process.env.PROD_DB_USER
        : process.env.DB_USER,
    password: process.env.NODE_ENV === 'production'
        ? process.env.PROD_DB_PASSWORD
        : process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(config);

// Test connection
pool.on('connect', () => {
    console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Helper for transactions
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // Set a timeout to prevent hanging transactions
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);

    client.release = () => {
        clearTimeout(timeout);
        client.release();
    };

    return { client, query, release };
};

module.exports = {
    query,
    pool,
    getClient
};
