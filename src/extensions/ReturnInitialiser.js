/**
 * Return the module as is, ignoring any args.
 */
export default class ReturnInitialiser {

    canInitialise (extensionApi) {
        return extensionApi.serviceDefinition.init === 'return';
    }

    initialise (instanceCreatedCallback, loadedModule) {

        instanceCreatedCallback(loadedModule);

        return loadedModule;

    }

}
