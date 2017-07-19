import { Promise } from '../globals';

/**
 * Use this to define a service as an alias of an arg
 */
export default class AliasExtension {

    canLoadModule (extensionApi) {
        return !!extensionApi.serviceDefinition.alias;
    }

    loadModule (extensionApi) {
        return extensionApi.resolveArg(extensionApi.serviceDefinition.alias);
    }

    canInitialise (extensionApi) {
        return !!extensionApi.serviceDefinition.alias;
    }

    initialise (instanceCreatedCallback, loadedModule) {
        return loadedModule;
    }

    lintLoader (extensionApi) {

        const { alias } = extensionApi.serviceDefinition;

        return new Promise((resolve) => resolve(extensionApi.getArgResolver(alias)))
            .then(() => [])
            .catch(() => ['Unable to resolve alias']);

    }

}
