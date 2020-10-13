class CustomError {
    constructor (message, code, description) {
        if (description instanceof CustomError) {
            this.message = description.message
            this.code = description.code
            this.description = description.description
            this.stack = description.stack
        } else if (description instanceof Error) {
            this.message = description.message
            this.code = 500
            this.description = description
            this.stack = description.stack
        } else {
            this.message = (message || 'No error message provided')
            this.code = (code || 500)
            this.description = (description || 'No more information')
            this.stack = new Error().stack
        }
    }
}

module.exports = CustomError
