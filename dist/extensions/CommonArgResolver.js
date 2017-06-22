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
        global.CommonArgResolver = mod.exports;
    }
})(this, function (exports, _globals) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });


    const COMMON_ARGS = {
        emptyString: '',
        true: true,
        false: false,
        noop: _globals._.noop
    };

    /**
     * Use this to add some common args to the container.
     */
    class CommonArgResolver {

        canResolveArg(argDefinition) {
            return argDefinition === 'container' || _globals._.has(COMMON_ARGS, argDefinition);
        }

        resolveArg(argDefinition, extensionApi) {
            return _globals.Promise.resolve(argDefinition === 'container' ? extensionApi.container : COMMON_ARGS[argDefinition]);
        }

    }
    exports.default = CommonArgResolver;
});