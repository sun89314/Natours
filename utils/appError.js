class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        //if the statusCode starts with 4, it is a fail, otherwise it is an error
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        // isOperational is used to determine whether the error is operational or programming error
        this.isOperational = true;
        // this.stack = Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = AppError;