/**
 * Use this to define a service which returns a new instance every time
 */
export default class NoCacheExtension {

    canHandleExtra (extraDefinition) {
        return extraDefinition === 'no-cache';
    }

    onGetComplete (extraDefinition, extensionApi) {
        delete extensionApi.container.cache[extensionApi.serviceId];
    }

}
