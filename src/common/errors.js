class CustomError {
    constructor(message, code, description) {
        this.message = (message ? message : "No error message provided");
        this.code = (code ? code : 400);
        this.description = (description ? description : "No more information");
        this.stack = new Error().stack
    }
};

module.exports = CustomError;