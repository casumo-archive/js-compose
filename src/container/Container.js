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

    return Promise
        .all(_.map(this.config.services, getServiceErrors.bind(this)))
        .then(results => _.compact(_.flattenDeep(results)));
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

function getServiceErrors (serviceDefinition, serviceId) {
    let errors = [];
    const extraDefinitions = serviceDefinition.extras;
    const extensionApi = new ExtensionApi(this, serviceId, serviceDefinition);
    const moduleLoader = getModuleLoader(this.moduleLoaders, extensionApi);
    const initialiser = getInitialiser(this.initialisers, extensionApi);

    errors = errors.concat(getModuleLoaderErrors(moduleLoader, serviceId, extensionApi));
    errors = errors.concat(getInitialiserErrors(initialiser, serviceId));
    errors = errors.concat(getArgsErrors(serviceId, serviceDefinition, extensionApi));
    errors = errors.concat(getExtrasErrors(extraDefinitions, serviceId, this.extraHandlers, extensionApi));

    return Promise.all(errors);
}

function getInitialiserErrors (initialiser, serviceId) {
    if (!initialiser) {
        return [`Missing initialiser for ${ serviceId }`];
    }
}

function getModuleLoaderErrors (moduleLoader, serviceId, extensionApi) {
    if (!moduleLoader) {
        return [`Missing module loader for ${ serviceId }`];
    } else if (moduleLoader.lintLoader) {
        return [moduleLoader.lintLoader(extensionApi)];
    }
}

function getArgsErrors (serviceId, serviceDefinition, extensionApi) {
    const { args } = serviceDefinition;
    const errors = [];
    const boundLintArg = _.partial(getSingleArgErrors, serviceId, extensionApi);

    return _.filter(_.map(args, boundLintArg));
}

function getSingleArgErrors (serviceId, extensionApi, argDefinition, index) {
    try {
        const argResolver = extensionApi.getArgResolver(argDefinition);

        if (argResolver.lintArg) {
            return argResolver.lintArg(argDefinition, extensionApi);
        }
    } catch (e) {
        return `Missing argResolver at [${ index }] for ${ serviceId }`;
    }
}

function getExtrasErrors (extraDefinitions, serviceId, extraHandlers, extensionApi) {
    const boundLintExtra = _.partial(getSingleExtraErrors, serviceId, extensionApi, extraHandlers);

    return _.filter(_.map(extraDefinitions, boundLintExtra));
}

function getSingleExtraErrors (serviceId, extensionApi, extraHandlers, extraDefinition, index) {
    const extraHandler = getExtraHandler(extraDefinition, extraHandlers, extensionApi);

    if (!extraHandler) {
        return `Missing extraHandler at [${ index }] for ${ serviceId }`;
    } else if (extraHandler.lintExtra) {
        return extraHandler.lintExtra(extraDefinition, extensionApi);
    }
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
    return _.find(extraHandlers, handler => handler.canHandleExtra(extraDefinition, extensionApi));
}

function getAndCheckExtraHandler (...args) {
    const handler = getExtraHandler(...args);

    if (!handler) {
        throw new Error(`No extra handler for ${extraDefinition}`);
    }

    return handler;
}

function getModuleLoader (moduleLoaders, extensionApi) {
    return _.find(moduleLoaders, loader => loader.canLoadModule(extensionApi));
}

function getAndCheckModuleLoader (...args) {
    const moduleLoader = getModuleLoader(...args);

    if (!moduleLoader) {
        throw new Error('No module loader');
    }

    return moduleLoader;
}

function getInitialiser (initialisers, extensionApi) {
    return _.find(initialisers, initialiser => initialiser.canInitialise(extensionApi));
}

function getAndCheckInitialiser (...args) {
    const initialiser = getInitialiser(...args);

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

function initialiseService (params) {
    const { serviceAndArgs, initialiser, extraHandlers, extraDefinitions, extensionApi } = params;
    const instance = initialiser.initialise(
        instance => runOnInstanceCreatedCallback(instance, params),
        ...serviceAndArgs
    );
    const paramsWithInstance = _.extend({}, params, { instance });

    return Promise.resolve(paramsWithInstance);
}

function runOnInstanceCreatedCallback (instance, params) {
    const { extraHandlers, extraDefinitions, extensionApi } = params;

    extraHandlers.forEach((handler, index) => {
        const callback = handler.onServiceInstanceCreated;

        if (callback) {
            callback(
                instance,
                extraDefinitions[index],
                extensionApi
            );
        }
    });
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
