import { _ } from '../globals';

/**
 * Use this to use an existing service, or its property as a factory for other services.
 *
 * Service definition usage examples:
 *
 *      { factoryService: 'nameOfService' }
 *      { factoryService: 'nameOfService.propertyName' }
 */
export default class FactoryServiceLoader {

    canLoadModule (extensionApi) {
        return !!extensionApi.serviceDefinition.factoryService;
    }

    loadModule (extensionApi) {

        const [serviceId, propertyName] = extensionApi.serviceDefinition.factoryService.split('.');

        return extensionApi.container.get(serviceId).then((instance) => {

            if (!propertyName) {
                return instance;
            }

            if (!instance[propertyName]) {
                throw new Error(`Service "${serviceId}" has no property "${propertyName}".`);
            }

            if (_.isFunction(instance[propertyName])) {
                return instance[propertyName].bind(instance);
            }

            return instance[propertyName];
        });

    }

    lint (extensionApi) {

        return Promise.resolve().then(() => {

            const [serviceId] = extensionApi.serviceDefinition.factoryService.split('.');

            if (extensionApi.container.config.services[serviceId]) {
                return [];
            }

            return [`Missing definition for factory service '${serviceId}'`];

        });

    }

}
