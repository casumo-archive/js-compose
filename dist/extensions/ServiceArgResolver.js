(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports', '../globals'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require('../globals'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.globals);
        global.ServiceArgResolver = mod.exports;
    }
})(this, function (exports, _globals) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    class ServiceArgResolver {

        canResolveArg(argDefinition) {
            return argDefinition.substring(0, 1) === '@';
        }

        resolveArg(argDefinition, extensionApi) {

            const [serviceName, ...path] = argDefinition.substring(1).split('.');

            return extensionApi.container.get(serviceName).then(service => {

                if (!path.length) {
                    return service;
                }

                return _globals._.get(service, path.join('.'));
            });
        }

    }
    exports.default = ServiceArgResolver;
});