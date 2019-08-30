module.exports = class ServerError extends Error {

    constructor(message, brief, status) {
        super();
        this.message = message;

        if (!!brief)
            this.brief = brief;

        if (!!status)
            this.status = status;
    }

    toString() {
        let status = this.status;
        let message = this.message;

        return `Error ${status ? 'with status ' + status : ''}: ${message}`;
    }
};
