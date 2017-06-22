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
        global.ES6ModuleLoaderDecorator = mod.exports;
    }
})(this, function (exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    /**
     * Use this to support ES6 default exports in other module loaders.
     *
     * Note. This implementation could have unexpected results if userland code
     * uses the key "default".
     */
    class ES6ModuleLoaderDecorator {

        constructor(decorated) {
            this.decorated = decorated;
        }

        canLoadModule(extensionApi) {
            return this.decorated.canLoadModule(extensionApi);
        }

        loadModule(extensionApi) {

            return this.decorated.loadModule(extensionApi).then(loadedModule => {

                if (loadedModule.default) {
                    return loadedModule.default;
                }

                return loadedModule;
            });
        }

    }
    exports.default = ES6ModuleLoaderDecorator;
});