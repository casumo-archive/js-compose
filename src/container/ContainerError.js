
export default function ContainerError (serviceId, error) {
    this.message = `Error with "${serviceId}": ${error.message}`;
    error.message = this.message;
    this.stack = error.stack;
}

ContainerError.prototype = Object.create(Error.prototype);
