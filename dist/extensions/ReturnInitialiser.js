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
        global.ReturnInitialiser = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    /**
     * Return the module as is, ignoring any args.
     */
    class ReturnInitialiser {

        canInitialise(extensionApi) {
            return extensionApi.serviceDefinition.init === 'return';
        }

        initialise(instanceCreatedCallback, loadedModule) {

            instanceCreatedCallback(loadedModule);

            return loadedModule;
        }

    }
    exports.default = ReturnInitialiser;
});