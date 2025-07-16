const { Pool } = require('pg');

// Secure database connection configuration
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: true,
        // In production, you'd add the RDS CA certificate here
        // ca: fs.readFileSync('rds-ca-2019-root.pem')
    } : {
        // Development: More lenient SSL for easier setup
        rejectUnauthorized: false
    },
    // Connection pool settings optimized for Lambda
    max: 1, // Single connection per Lambda instance
    min: 0, // No minimum connections
    idleTimeoutMillis: 10000, // Close idle connections quickly
    connectionTimeoutMillis: 5000,
    acquireTimeoutMillis: 5000, // Timeout for acquiring connections
});

// Handle connection errors gracefully
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit process in Lambda - just log the error
    console.error('Pool error occurred, continuing...');
});

// Graceful shutdown function for Lambda
const closePool = async () => {
    try {
        await pool.end();
        console.log('Database pool closed successfully');
    } catch (err) {
        console.error('Error closing database pool:', err);
    }
};

// Export both pool and cleanup function
module.exports = { pool, closePool };