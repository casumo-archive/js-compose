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
        global.FactoryInitialiser = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    /**
     * Initialise the module by invoking it with any args.
     */
    class FactoryInitialiser {

        canInitialise(extensionApi) {
            return extensionApi.serviceDefinition.init === 'factory';
        }

        initialise(instanceCreatedCallback, loadedModule, ...args) {

            const instance = loadedModule(...args);

            instanceCreatedCallback(instance);

            return instance;
        }

    }
    exports.default = FactoryInitialiser;
});