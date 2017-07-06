export class ArgError extends Error {
    constructor (argDefinition, e) {

        super(`Arg '${argDefinition}', ${e.message}`);

        if (e instanceof ArgError) {
            return e;
        }

        this.innerError = new Error(this.message);
        this.stack = e.stack;

    }
}
