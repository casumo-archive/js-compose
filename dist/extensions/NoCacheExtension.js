(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.NoCacheExtension = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    /**
     * Use this to define a service which returns a new instance every time
     */
    class NoCacheExtension {

        canHandleExtra(extraDefinition) {
            return extraDefinition === 'no-cache';
        }

        onGetComplete(extraDefinition, extensionApi) {
            delete extensionApi.container.cache[extensionApi.serviceId];
        }

    }
    exports.default = NoCacheExtension;
});