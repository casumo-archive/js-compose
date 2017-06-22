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
        global.ConstructorInitialiser = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    /**
     * Initialise the module with any args using "new".
     */
    class ConstructorInitialiser {

        canInitialise(extensionApi) {
            return extensionApi.serviceDefinition.init === 'constructor';
        }

        initialise(instanceCreatedCallback, Constructor, ...args) {

            const instance = new Constructor(...args);

            if (Constructor.length !== args.length) {
                // eslint-disable-next-line no-undef
                console.warn('👉 "%s" has been initialised with %d parameter(s). Constructor takes %d parameter(s).',
                // eslint-disable-next-line no-underscore-dangle
                Constructor.prototype.__moduleId__, args.length, Constructor.length);
            }

            instanceCreatedCallback(instance);

            return instance;
        }

    }
    exports.default = ConstructorInitialiser;
});