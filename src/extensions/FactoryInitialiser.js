/**
 * Initialise the module by invoking it with any args.
 */
export default class FactoryInitialiser {

    canInitialise (extensionApi) {
        return extensionApi.serviceDefinition.init === 'factory';
    }

    initialise (instanceCreatedCallback, loadedModule, ...args) {

        const instance = loadedModule(...args);

        instanceCreatedCallback(instance);

        return instance;
    }

}
