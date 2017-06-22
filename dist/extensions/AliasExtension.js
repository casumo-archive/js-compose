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
        global.AliasExtension = mod.exports;
    }
})(this, function (exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    /**
     * Use this to define a service as an alias of an arg
     */
    class AliasExtension {

        canLoadModule(extensionApi) {
            return !!extensionApi.serviceDefinition.alias;
        }

        loadModule(extensionApi) {
            return extensionApi.resolveArg(extensionApi.serviceDefinition.alias);
        }

        canInitialise(extensionApi) {
            return !!extensionApi.serviceDefinition.alias;
        }

        initialise(instanceCreatedCallback, loadedModule) {
            return loadedModule;
        }

    }
    exports.default = AliasExtension;
});