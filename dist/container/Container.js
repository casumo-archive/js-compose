(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports', '../globals', './ContainerError', './ExtensionApi'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require('../globals'), require('./ContainerError'), require('./ExtensionApi'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.globals, global.ContainerError, global.ExtensionApi);
        global.Container = mod.exports;
    }
})(this, function (exports, _globals, _ContainerError, _ExtensionApi) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.defaultInitialiser = defaultInitialiser;

    var _ContainerError2 = _interopRequireDefault(_ContainerError);

    var _ExtensionApi2 = _interopRequireDefault(_ExtensionApi);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function countOccurrences(array, item) {
        return array.filter(_globals._.isEqual.bind(_globals._, item)).length;
    }

    class Container {

        constructor(extensions, config) {
            this.moduleLoaders = _globals._.filter(extensions, _globals._.property('canLoadModule'));
            this.argResolvers = _globals._.filter(extensions, _globals._.property('canResolveArg'));
            this.initialisers = _globals._.filter(extensions, _globals._.property('canInitialise'));
            this.extraHandlers = _globals._.filter(extensions, _globals._.property('canHandleExtra'));
            this.config = config;
            this.cache = {};
            this.chain = [];
        }

        /**
         * @param {String} id
         *
         * @return {Promise}
         */
        get(id) {

            const self = this;
            const definition = self.config.services[id];
            let mappedExtraHandlers;
            const ComposedError = _globals._.partial(_ContainerError2.default, id);
            const extensionApi = new _ExtensionApi2.default(self, id, definition, resolveArgs);

            function resolveArgs(argDefinitions) {

                return _globals._.map(argDefinitions || [], argDefinition => {

                    const argResolver = _globals._.find(self.argResolvers, argResolver => {
                        return argResolver.canResolveArg(argDefinition);
                    });

                    if (!argResolver) {
                        throw new Error(`No arg resolver for ${argDefinition}`);
                    }

                    return argResolver.resolveArg(argDefinition, extensionApi).then(null, error => {

                        if (!(error instanceof _ContainerError2.default)) {
                            error.message = `Arg resolver failed for ${argDefinition}. Reason: ${error.message}`;
                        }

                        throw error;
                    });
                });
            }

            const output = self.cache[id] || new _globals.Promise(resolve => {

                if (!definition) {
                    throw new Error('Missing definition');
                }

                if (countOccurrences(self.chain, id) > 1) {
                    throw new Error(`Circular dependency detected: ${self.chain.concat(id).join(', ')}`);
                }

                mappedExtraHandlers = _globals._.map(definition.extras || [], extraDefinition => {

                    const handler = _globals._.find(self.extraHandlers, extraHandler => {
                        return extraHandler.canHandleExtra(extraDefinition, extensionApi);
                    });

                    if (!handler) {
                        throw new Error(`No extra handler for ${extraDefinition}`);
                    }

                    return handler;
                });

                const moduleLoader = _globals._.find(self.moduleLoaders, moduleLoader => {
                    return moduleLoader.canLoadModule(extensionApi);
                });

                if (!moduleLoader) {
                    throw new Error('No module loader');
                }

                const promises = resolveArgs(definition.args);

                promises.unshift(moduleLoader.loadModule(extensionApi));

                const initialiser = _globals._.find(self.initialisers, initialiser => {
                    return initialiser.canInitialise(extensionApi);
                });

                if (!initialiser) {
                    throw new Error('No initialiser');
                }

                self.cache[id] = _globals.Promise.all(promises).then(contents => {

                    const initialisedPromises = _globals._.map(mappedExtraHandlers, (handler, extraIndex) => {
                        if (handler.beforeServiceInitialised) {
                            return handler.beforeServiceInitialised(definition.extras[extraIndex], extensionApi);
                        }
                    });

                    return _globals.Promise.all(initialisedPromises).then(() => {
                        return contents;
                    });
                }).then(contents => {

                    return initialiser.initialise(
                    // eslint-disable-next-line prefer-arrow-callback
                    function instanceCreatedCallback(instance) {

                        mappedExtraHandlers.forEach((handler, extraIndex) => {

                            if (handler.onServiceInstanceCreated) {

                                handler.onServiceInstanceCreated(instance, definition.extras[extraIndex], extensionApi);
                            }
                        });
                    }, ...contents);
                }).then(instance => {

                    const initialisedPromises = _globals._.map(mappedExtraHandlers, (handler, extraIndex) => {
                        if (handler.onServiceInitialised) {
                            return handler.onServiceInitialised(instance, definition.extras[extraIndex], extensionApi);
                        }
                    });

                    return _globals.Promise.all(initialisedPromises).then(() => {
                        return instance;
                    });
                });

                resolve(self.cache[id]);
            }).then(null, error => {

                if (error instanceof _ContainerError2.default) {
                    throw error;
                }

                throw new ComposedError(error);
            });

            _globals._.each(mappedExtraHandlers, (handler, extraIndex) => {
                if (handler.onGetComplete) {
                    handler.onGetComplete(definition.extras[extraIndex], extensionApi);
                }
            });

            return output;
        }

    }

    exports.default = Container;
    /**
     * @static
     *
     * @param {Initialiser} initialiser
     *
     * @return {Initialiser}
     */
    function defaultInitialiser(initialiser) {

        return _globals._.extend({}, initialiser, {
            canInitialise(extensionApi) {

                if (!extensionApi.serviceDefinition.init) {
                    return true;
                }

                return initialiser.canInitialise(extensionApi);
            }
        });
    }
});