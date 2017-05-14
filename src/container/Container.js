import { _, Promise } from '../globals';
import ContainerError from './ContainerError';
import ExtensionApi from './ExtensionApi';

/**
 * Shim for function available in later underscore versions.
 * @todo Update underscore and remove this
 */
function property (key) {
    return function (object) {
        return object[key];
    };
}

function countOccurrences (array, item) {
    return array.filter( _.isEqual.bind(_, item) ).length;
}

export default function Container (extensions, config) {
    this.moduleLoaders = _.filter(extensions, property('canLoadModule'));
    this.argResolvers = _.filter(extensions, property('canResolveArg'));
    this.initialisers = _.filter(extensions, property('canInitialise'));
    this.extraHandlers = _.filter(extensions, property('canHandleExtra'));
    this.config = config;
    this.cache = {};
    this.chain = [];
}

/**
 * @param {String} id
 *
 * @return {Promise}
 */
Container.prototype.get = function(id) {

    var self = this,
        output,
        definition = self.config.services[id],
        mappedExtraHandlers,
        ComposedError = _.partial(ContainerError, id),
        extensionApi;

    function resolveArgs(argDefinitions) {

        return _.map(argDefinitions || [], function(argDefinition) {

            var argResolver = _.find(self.argResolvers, function(argResolver) {
                return argResolver.canResolveArg(argDefinition);
            });

            if (!argResolver) {
                throw new Error('No arg resolver for ' + argDefinition);
            }

            return argResolver.resolveArg(argDefinition, extensionApi).then(null, function(error) {

                if (!(error instanceof ContainerError)) {
                    error.message = 'Arg resolver failed for ' + argDefinition + '. Reason: ' + error.message;
                }

                throw error;
            });

        });

    }

    extensionApi = new ExtensionApi(self, id, definition, resolveArgs);

    output = self.cache[id] || new Promise(function(resolve) {

        var promises,
            moduleLoader,
            initialiser;

        if (!definition) {
            throw new Error('Missing definition');
        }

        if (countOccurrences(self.chain, id) > 1) {
            throw new Error('Circular dependency detected: ' + self.chain.concat(id).join(', '));
        }

        mappedExtraHandlers = _.map(definition.extras || [], function(extraDefinition) {

            var handler = _.find(self.extraHandlers, function(extraHandler) {
                return extraHandler.canHandleExtra(extraDefinition, extensionApi);
            });

            if (!handler) {
                throw new Error('No extra handler for ' + extraDefinition);
            }

            return handler;

        });

        moduleLoader = _.find(self.moduleLoaders, function(moduleLoader) {
            return moduleLoader.canLoadModule(extensionApi);
        });

        if (!moduleLoader) {
            throw new Error('No module loader');
        }

        promises = resolveArgs(definition.args);

        promises.unshift( moduleLoader.loadModule(extensionApi) );

        initialiser = _.find(self.initialisers, function(initialiser) {
            return initialiser.canInitialise(extensionApi);
        });

        if (!initialiser) {
            throw new Error('No initialiser');
        }

        self.cache[id] = Promise.all(promises).then(function(contents) {

            var initialisedPromises = _.map(mappedExtraHandlers, function(handler, extraIndex) {
                if (handler.beforeServiceInitialised) {
                    return handler.beforeServiceInitialised(definition.extras[extraIndex], extensionApi);
                }
            });

            return Promise.all(initialisedPromises).then(function() {
                return contents;
            });

        }).then(function(contents) {

            return initialiser.initialise.apply(
                initialiser,
                [
                    function instanceCreatedCallback(instance) {

                        mappedExtraHandlers.forEach(function(handler, extraIndex) {

                            if (handler.onServiceInstanceCreated) {

                                handler.onServiceInstanceCreated(
                                    instance,
                                    definition.extras[extraIndex],
                                    extensionApi
                                );

                            }

                        });

                    }
                ].concat(contents)
            );

        }).then(function(instance) {

            var initialisedPromises = _.map(mappedExtraHandlers, function(handler, extraIndex) {
                if (handler.onServiceInitialised) {
                    return handler.onServiceInitialised(instance, definition.extras[extraIndex], extensionApi);
                }
            });

            return Promise.all(initialisedPromises).then(function() {
                return instance;
            });

        });

        resolve(self.cache[id]);

    }).then(null, function(error) {

        if (error instanceof ContainerError) {
            throw error;
        }

        throw new ComposedError(error);
    });

    _.each(mappedExtraHandlers, function(handler, extraIndex) {
        if (handler.onGetComplete) {
            handler.onGetComplete(definition.extras[extraIndex], extensionApi);
        }
    });

    return output;
};

/**
 * @static
 *
 * @param {Initialiser} initialiser
 *
 * @return {Initialiser}
 */
export function defaultInitialiser (initialiser) {

    return _.extend({}, initialiser, {
        canInitialise: function(extensionApi) {

            if (!extensionApi.serviceDefinition.init) {
                return true;
            }

            return initialiser.canInitialise(extensionApi);
        }
    });
};
