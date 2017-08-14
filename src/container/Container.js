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
 * @param {String} serviceId
 *
 * @return {Promise}
 */
function get (serviceId) {
    const self = this;
    const serviceDefinition = self.config.services[serviceId];
    const extensionApi = new ExtensionApi(self, serviceId, serviceDefinition);
    const cached = self.cache[serviceId];

    if (cached) {
        runOnGetCompleteCallbacks({ serviceDefinition, extensionApi });

        return cached;
    }

    return new Promise((resolve) => {
        // Add the service to the cache as soon as possible
        self.cache[serviceId] = loadServiceAndArgs(
                serviceId,
                serviceDefinition,
                self.chain,
                self.extraHandlers,
                self.moduleLoaders,
                self.initialisers,
                extensionApi
            )
            .then(runBeforeInitialisedCallbacks)
            .then(initialiseService)
            .then(runOnInitialisedCallbacks)
            .then(runOnGetCompleteCallbacks)
            .then(({ instance }) => instance);

        resolve(self.cache[serviceId]);

    }).catch(error => {
        throw new ServiceError(serviceId, error);
    });
}

function loadServiceAndArgs (
    serviceId,
    serviceDefinition,
    chain,
    availableExtraHandlers,
    moduleLoaders,
    initialisers,
    extensionApi
) {
    checkIfServiceExists(serviceId, serviceDefinition);
    checkCircularDependencies(chain, serviceId);

    const args = serviceDefinition.args || [];
    const extraDefinitions = serviceDefinition.extras;
    const extraHandlers = getExtraHandlers(extraDefinitions, availableExtraHandlers, extensionApi);
    const moduleLoader = getAndCheckModuleLoader(moduleLoaders, extensionApi);
    const initialiser = getAndCheckInitialiser(initialisers, extensionApi);
    const serviceAndArgPromises = getServiceAndArgPromises(args, moduleLoader, extensionApi);

    return Promise
        .all(serviceAndArgPromises)
        .then(serviceAndArgs => ({
            serviceId,
            serviceDefinition,
            serviceAndArgs,
            extraHandlers,
            initialiser,
            extraDefinitions,
            moduleLoader,
            extensionApi
        }));
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

function countOccurrencesInArray (array, item) {
    return array
        .filter(arrayItem => _.isEqual(arrayItem, item))
        .length;
}

function getExtraHandlers (extraDefinitions = [], extraHandlers, extensionApi) {
    return _.map(
        extraDefinitions,
        extraDefinition => getAndCheckExtraHandler(extraDefinition, extraHandlers, extensionApi)
    );
}

function getExtraHandler (extraDefinition, extraHandlers, extensionApi) {
    return _.find(extraHandlers, extraHandler => {
        return extraHandler.canHandleExtra(extraDefinition, extensionApi);
    });
}

function getAndCheckExtraHandler (extraDefinition, extraHandlers, extensionApi) {
    const handler = getExtraHandler(extraDefinition, extraHandlers, extensionApi);

    if (!handler) {
        throw new Error(`No extra handler for ${extraDefinition}`);
    }

    return handler;
}

function getModuleLoader (moduleLoaders, extensionApi) {
    return _.find(moduleLoaders, moduleLoader => {
        return moduleLoader.canLoadModule(extensionApi);
    });
}

function getAndCheckModuleLoader (moduleLoaders, extensionApi) {
    const moduleLoader = getModuleLoader(moduleLoaders, extensionApi);

    if (!moduleLoader) {
        throw new Error('No module loader');
    }

    return moduleLoader;
}

function getInitialiser (initialisers, extensionApi) {
    return _.find(initialisers, initialiser => {
        return initialiser.canInitialise(extensionApi);
    });
}

function getAndCheckInitialiser (initialisers, extensionApi) {
    const initialiser = getInitialiser(initialisers, extensionApi);

    if (!initialiser) {
        throw new Error('No initialiser');
    }

    return initialiser;

}

function getServiceAndArgPromises (args, moduleLoader, extensionApi) {
    const modulePromise = moduleLoader.loadModule(extensionApi);
    const promises = extensionApi.resolveArgs(args);

    promises.unshift(modulePromise);

    return promises;
}

function runBeforeInitialisedCallbacks (params) {
    const { serviceAndArgs, extraHandlers, extraDefinitions, extensionApi } = params;
    const promises = _.map(extraHandlers, (handler, index) => {
        const callback = handler.beforeServiceInitialised;

        if (callback) {
            return callback(
                extraDefinitions[index],
                extensionApi
            );
        }
    });

    return Promise
        .all(promises)
        .then(() => params);
}

function initialiseService (params) {
    const { serviceAndArgs, initialiser, extraHandlers, extraDefinitions, extensionApi } = params;
    const instance = initialiser.initialise(
        // eslint-disable-next-line prefer-arrow-callback
        function instanceCreatedCallback (instance) {

            extraHandlers.forEach((handler, index) => {

                if (handler.onServiceInstanceCreated) {

                    handler.onServiceInstanceCreated(
                        instance,
                        extraDefinitions[index],
                        extensionApi
                    );
                }

            });

        },
        ...serviceAndArgs
    );

    return Promise.resolve(_.extend({}, params, { instance }));
}

function runOnInitialisedCallbacks (params) {
    const { instance, extraHandlers, extraDefinitions, extensionApi } = params;
    const promises = _.map(extraHandlers, (handler, extraIndex) => {
        const callback = handler.onServiceInitialised;

        if (callback) {
            return callback(
                instance,
                extraDefinitions[extraIndex],
                extensionApi
            );
        }
    });

    return Promise
        .all(promises)
        .then(() => params);
}

function runOnGetCompleteCallbacks (params) {
    const { extraHandlers, serviceDefinition, extensionApi } = params;

    _.each(extraHandlers, (handler, index) => {
        const callback = handler.onGetComplete;

        if (callback) {
            callback(
                serviceDefinition.extras[index],
                extensionApi
            );
        }
    });

    return params;
}

function checkCircularDependencies (chain, serviceId) {
    if (countOccurrencesInArray(chain, serviceId) > 1) {
        const dependencyChain = chain.concat(serviceId).join(', ');

        throw new Error(`Circular dependency detected: ${ dependencyChain }` );
    }
}

function checkIfServiceExists (serviceId, serviceDefinition) {
    if (!serviceDefinition) {
        throw new Error(`Missing service definition for ${ serviceId }`);
    }
}
