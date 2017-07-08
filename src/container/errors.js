export class ServiceError extends Error {
    constructor (serviceId, e) {

        super(`Service '${serviceId}', ${e.message}`);

        if (e instanceof ServiceError) {
            return e;
        }

        this.stack = e.stack;

    }
}

export class ArgError extends Error {
    constructor (argDefinition, e) {

        super(`Arg '${argDefinition}', ${e.message}`);

        if (e instanceof ArgError || e instanceof ServiceError) {
            return e;
        }

        this.stack = e.stack;

    }
}
