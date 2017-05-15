import { _, Promise } from '../globals';
import ContainerError from './ContainerError';
import ExtensionApi from './ExtensionApi';

function countOccurrences (array, item) {
    return array.filter(_.isEqual.bind(_, item)).length;
}

export default class Container {

    constructor (extensions, config) {
        this.moduleLoaders = _.filter(extensions, _.property('canLoadModule'));
        this.argResolvers = _.filter(extensions, _.property('canResolveArg'));
        this.initialisers = _.filter(extensions, _.property('canInitialise'));
        this.extraHandlers = _.filter(extensions, _.property('canHandleExtra'));
        this.config = config;
        this.cache = {};
        this.chain = [];
    }

    /**
     * @param {String} id
     *
     * @return {Promise}
     */
    get (id) {

        const self = this;
        const definition = self.config.services[id];
        let mappedExtraHandlers;
        const ComposedError = _.partial(ContainerError, id);
        const extensionApi = new ExtensionApi(self, id, definition, resolveArgs);

        function resolveArgs (argDefinitions) {

            return _.map(argDefinitions || [], (argDefinition) => {

                const argResolver = _.find(self.argResolvers, (argResolver) => {
                    return argResolver.canResolveArg(argDefinition);
                });

                if (!argResolver) {
                    throw new Error(`No arg resolver for ${argDefinition}`);
                }

                return argResolver.resolveArg(argDefinition, extensionApi).then(null, (error) => {

                    if (!(error instanceof ContainerError)) {
                        error.message = `Arg resolver failed for ${argDefinition}. Reason: ${error.message}`;
                    }

                    throw error;
                });

            });

        }

        const output = self.cache[id] || new Promise((resolve) => {

            if (!definition) {
                throw new Error('Missing definition');
            }

            if (countOccurrences(self.chain, id) > 1) {
                throw new Error(`Circular dependency detected: ${self.chain.concat(id).join(', ')}`);
            }

            mappedExtraHandlers = _.map(definition.extras || [], (extraDefinition) => {

                const handler = _.find(self.extraHandlers, (extraHandler) => {
                    return extraHandler.canHandleExtra(extraDefinition, extensionApi);
                });

                if (!handler) {
                    throw new Error(`No extra handler for ${extraDefinition}`);
                }

                return handler;

            });

            const moduleLoader = _.find(self.moduleLoaders, (moduleLoader) => {
                return moduleLoader.canLoadModule(extensionApi);
            });

            if (!moduleLoader) {
                throw new Error('No module loader');
            }

            const promises = resolveArgs(definition.args);

            promises.unshift(moduleLoader.loadModule(extensionApi));

            const initialiser = _.find(self.initialisers, (initialiser) => {
                return initialiser.canInitialise(extensionApi);
            });

            if (!initialiser) {
                throw new Error('No initialiser');
            }

            self.cache[id] = Promise.all(promises).then((contents) => {

                const initialisedPromises = _.map(mappedExtraHandlers, (handler, extraIndex) => {
                    if (handler.beforeServiceInitialised) {
                        return handler.beforeServiceInitialised(definition.extras[extraIndex], extensionApi);
                    }
                });

                return Promise.all(initialisedPromises).then(() => {
                    return contents;
                });

            }).then((contents) => {

                // eslint-disable-next-line prefer-spread
                return initialiser.initialise.apply(
                    initialiser,
                    [
                        function instanceCreatedCallback (instance) {

                            mappedExtraHandlers.forEach((handler, extraIndex) => {

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

            }).then((instance) => {

                const initialisedPromises = _.map(mappedExtraHandlers, (handler, extraIndex) => {
                    if (handler.onServiceInitialised) {
                        return handler.onServiceInitialised(
                            instance,
                            definition.extras[extraIndex],
                            extensionApi
                        );
                    }
                });

                return Promise.all(initialisedPromises).then(() => {
                    return instance;
                });

            });

            resolve(self.cache[id]);

        }).then(null, (error) => {

            if (error instanceof ContainerError) {
                throw error;
            }

            throw new ComposedError(error);
        });

        _.each(mappedExtraHandlers, (handler, extraIndex) => {
            if (handler.onGetComplete) {
                handler.onGetComplete(definition.extras[extraIndex], extensionApi);
            }
        });

        return output;
    }

}

/**
 * @static
 *
 * @param {Initialiser} initialiser
 *
 * @return {Initialiser}
 */
export function defaultInitialiser (initialiser) {

    return _.extend({}, initialiser, {
        canInitialise (extensionApi) {

            if (!extensionApi.serviceDefinition.init) {
                return true;
            }

            return initialiser.canInitialise(extensionApi);
        }
    });
}
