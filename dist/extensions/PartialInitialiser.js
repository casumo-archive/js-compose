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
        global.PartialInitialiser = mod.exports;
    }
})(this, function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    /**
     * Partially applies the loaded module with any args
     */
    class PartialInitialiser {

        canInitialise(extensionApi) {
            return extensionApi.serviceDefinition.init === 'partial';
        }

        initialise(instanceCreatedCallback, Original, ...partialArgs) {

            // PartiallyApplied and Original aren't always constructors but the additional
            // modifications needed for constructors don't impact functions afaik
            function PartiallyApplied(...args) {

                const instance = Original.call(this, ...partialArgs, ...args);

                if (instance || this) {
                    instanceCreatedCallback(instance || this);
                }

                return instance;
            }

            PartiallyApplied.prototype = Original.prototype;

            try {
                Object.defineProperty(PartiallyApplied, 'name', {
                    value: Original.name
                });
            } catch (e) {
                // eslint-disable-next-line no-undef
                console.warn('Cannot redefine readonly name on Partial');
            }

            return PartiallyApplied;
        }

    }
    exports.default = PartialInitialiser;
});