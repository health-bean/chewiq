const { Pool } = require('pg');

const pool = new Pool({
    host: 'health-platform-dev-db.c5njva4wrrhe.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'health_platform_dev',
    user: 'healthadmin',
    password: 'TempPassword123!',
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = { pool };
