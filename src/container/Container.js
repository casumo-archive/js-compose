import { _, Promise } from '../globals';
import ExtensionApi from './ExtensionApi';
import { ServiceError } from './errors';

export default function Container (extensions, config) {
    return {
        moduleLoaders: _.filter(extensions, 'canLoadModule'),
        argResolvers: _.filter(extensions, _.property('canResolveArg')),
        initialisers: _.filter(extensions, _.property('canInitialise')),
        extraHandlers: _.filter(extensions, _.property('canHandleExtra')),
        config: config,
        cache: {},
        chain: [],
        get,
        lint
    }
}

/**
 * @param {String} id
 *
 * @return {Promise}
 */
function get (id) {

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

        mappedExtraHandlers = getMappedExtraHandlers(definition.extras, self.extraHandlers, extensionApi);

        const moduleLoader = getModuleLoader(self.moduleLoaders, extensionApi);

        if (!moduleLoader) {
            throw new Error('No module loader');
        }

        const args = definition.args || [];
        const promises = getPromises(args, moduleLoader, extensionApi);

        const initialiser = getInitialiser(self.initialisers, extensionApi);

        if (!initialiser) {
            throw new Error('No initialiser');
        }


        self.cache[id] = Promise
            .all(promises)
            .then(contents => afterInitialised(contents, mappedExtraHandlers, definition.extras, extensionApi))
            .then(contents => {

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
function lint () {

    return Promise.all(_.map(this.config.services, (serviceDefinition, serviceId) => {

        const errors = [];
        const extensionApi = new ExtensionApi(this, serviceId, serviceDefinition);

        const moduleLoader = getModuleLoader(this.moduleLoaders, extensionApi);

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

function countOccurrences (array, item) {
    return array.filter(_.isEqual.bind(_, item)).length;
}

function getMappedExtraHandlers (extraDefinitions = [], extraHandlers, extensionApi) {
    return _.map(extraDefinitions, extraDefinition => {
        const handler = getHandlersForExtraDefinition(extraDefinition, extraHandlers, extensionApi);

        if (!handler) {
            throw new Error(`No extra handler for ${extraDefinition}`);
        }

        return handler;
    });
}

function getHandlersForExtraDefinition (extraDefinition, extraHandlers, extensionApi) {
    return _.find(extraHandlers, extraHandler => {
        return extraHandler.canHandleExtra(extraDefinition, extensionApi);
    });
}

function getModuleLoader (moduleLoaders, extensionApi) {
    return _.find(moduleLoaders, moduleLoader => {
        return moduleLoader.canLoadModule(extensionApi);
    });
}

function getInitialiser (initialisers, extensionApi) {
    return _.find(initialisers, initialiser => {
        return initialiser.canInitialise(extensionApi);
    });
}

function getPromises (args, moduleLoader, extensionApi) {
    const modulePromise = moduleLoader.loadModule(extensionApi);
    const promises = extensionApi.resolveArgs(args);

    promises.unshift(modulePromise);

    return promises;
}

function afterInitialised (contents, mappedExtraHandlers, extraHandlers, extensionApi) {
    const initialisedPromises = _.map(mappedExtraHandlers, (handler, extraIndex) => {
        if (handler.beforeServiceInitialised) {
            return handler.beforeServiceInitialised(extraHandlers[extraIndex], extensionApi);
        }
    });

    return Promise
        .all(initialisedPromises)
        .then(() => contents);
}
