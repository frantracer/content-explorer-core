class CustomError {
    constructor(message, code, description) {
        if(description instanceof CustomError) {
            this.message = description.message;
            this.code = description.code
            this.description = description.description
            this.stack = description.stack
        } else {
            this.message = (message ? message : "No error message provided");
            this.code = (code ? code : 400);
            this.description = (description ? description : "No more information");
            this.stack = new Error().stack
        }
    }
};

module.exports = CustomError;