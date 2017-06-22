(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.ContainerError = mod.exports;
    }
})(this, function (exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = ContainerError;
    function ContainerError(serviceId, error) {
        this.message = `Error with "${serviceId}": ${error.message}`;
        error.message = this.message;
        this.stack = error.stack;
    }

    ContainerError.prototype = Object.create(Error.prototype);
});