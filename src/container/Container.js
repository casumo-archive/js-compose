import { _, Promise } from '../globals';
import ExtensionApi from './ExtensionApi';
import { ServiceError } from './errors';

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
        const extensionApi = new ExtensionApi(self, id, definition);

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

            const promises = extensionApi.resolveArgs(definition.args || []);

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

                return initialiser.initialise(
                    // eslint-disable-next-line prefer-arrow-callback
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

                    },
                    ...contents
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
            throw new ServiceError(id, error);
        });

        _.each(mappedExtraHandlers, (handler, extraIndex) => {
            if (handler.onGetComplete) {
                handler.onGetComplete(definition.extras[extraIndex], extensionApi);
            }
        });

        return output;
    }

    /**
     * @return {Promise<Array<String>>} - A list of lint errors
     */
    lint () {

        return Promise.all(_.map(this.config.services, (serviceDefinition, serviceId) => {

            const errors = [];
            const extensionApi = new ExtensionApi(this, serviceId, serviceDefinition);

            const moduleLoader = _.find(this.moduleLoaders, (moduleLoader) => {
                return moduleLoader.canLoadModule(extensionApi);
            });

            if (!moduleLoader) {
                errors.push(`Missing module loader for ${serviceId}`);
            } else if (moduleLoader.lintLoader) {
                errors.push(moduleLoader.lintLoader(extensionApi));
            }

            const initialiser = _.find(this.initialisers, (initialiser) => {
                return initialiser.canInitialise(extensionApi);
            });

            if (!initialiser) {
                errors.push(`Missing initialiser for ${serviceId}`);
            }

            _.each(serviceDefinition.args, (argDefinition, i) => {

                try {
                    const argResolver = extensionApi.getArgResolver(argDefinition);

                    if (argResolver.lintArg) {
                        errors.push(argResolver.lintArg(argDefinition, extensionApi));
                    }
                } catch (e) {
                    errors.push(`Missing argResolver at [${i}] for ${serviceId}`);
                }

            });

            _.each(serviceDefinition.extras, (extraDefinition, i) => {

                const extraHandler = _.find(this.extraHandlers, (extraHandler) => {
                    return extraHandler.canHandleExtra(extraDefinition, extensionApi);
                });

                if (!extraHandler) {
                    errors.push(`Missing extraHandler at [${i}] for ${serviceId}`);
                } else if (extraHandler.lintExtra) {
                    errors.push(extraHandler.lintExtra(extraDefinition, extensionApi));
                }

            });

            return Promise.all(errors);

        })).then((results) => _.compact(_.flattenDeep(results)));

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
