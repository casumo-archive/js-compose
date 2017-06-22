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
        global.StructuredArgExtension = mod.exports;
    }
})(this, function (exports, _globals) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });


    /**
     * Use this to define a tree structure where all leaf nodes will be resolved as args
     *
     * Service definition usage examples:
     *
     *      {
     *          structuredArg: {
     *              key: '@arg1',
     *              more: ['@arg2', '%arg3']
     *          }
     *      }
     *
     * The above will resolve all args using any configured arg resolvers before returning
     */
    class StructuredArgExtension {

        canLoadModule(extensionApi) {
            return !!extensionApi.serviceDefinition.structuredArg;
        }

        canInitialise(extensionApi) {
            return this.canLoadModule(extensionApi);
        }

        initialise(instanceCreatedCallback, loadedModule) {
            return loadedModule;
        }

        loadModule(extensionApi) {

            const args = [];
            const placeholders = mapLeaves(extensionApi.serviceDefinition.structuredArg, arg => {
                args.push(arg);
                return args.length - 1;
            });

            return _globals.Promise.all(extensionApi.resolveArgs(args)).then(resolvedArgs => {

                return mapLeaves(placeholders, placeholder => {
                    return resolvedArgs[placeholder];
                });
            });
        }

    }

    exports.default = StructuredArgExtension;
    function concatObject(object, item, key) {
        object[key] = item;
        return object;
    }

    function concatArray(array, item) {
        return array.concat(item);
    }

    function mapLeaves(tree, mapFn) {

        let baseIterable;
        let concatFn;

        if (_globals._.isArray(tree)) {

            baseIterable = [];
            concatFn = concatArray;
        } else if (_globals._.isObject(tree)) {

            baseIterable = {};
            concatFn = concatObject;
        } else {
            return mapFn(tree);
        }

        return _globals._.reduce(tree, (memo, item, key) => concatFn(memo, mapLeaves(item, mapFn), key), baseIterable);
    }
});