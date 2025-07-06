class AppError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = this.constructor.name;
    }
}

const handleDatabaseError = (error, operation = 'database operation') => {
    console.error(`Database error during ${operation}:`, error);
    if (error.code === '23505') {
        return new AppError('Duplicate entry', 409);
    }
    if (error.code === '23503') {
        return new AppError('Referenced record not found', 404);
    }
    return new AppError(`Failed to complete ${operation}`, 500);
};

module.exports = {
    AppError,
    handleDatabaseError
};
