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
        global.DeferredArgResolver = mod.exports;
    }
})(this, function (exports, _globals) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    class DeferredArgResolver {

        canResolveArg(argDefinition) {
            return argDefinition.substring(0, 6) === 'defer:';
        }

        resolveArg(argDefinition, extensionApi) {

            return _globals._.constant(new _globals.Promise((resolve, reject) => {

                _globals._.defer(() => {
                    extensionApi.resolveArg(argDefinition.substring(6)).then(resolve, reject);
                });
            }));
        }

    }
    exports.default = DeferredArgResolver;
});