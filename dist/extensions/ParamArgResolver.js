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
        global.ParamArgResolver = mod.exports;
    }
})(this, function (exports, _globals) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    class ParamArgResolver {

        canResolveArg(argDefinition) {
            return argDefinition.substring(0, 1) === '%';
        }

        resolveArg(argDefinition, extensionApi) {
            return _globals.Promise.resolve(_globals._.get(extensionApi.container.config.params, argDefinition.substring(1)));
        }

    }
    exports.default = ParamArgResolver;
});