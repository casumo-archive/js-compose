import { _, Promise } from '../globals';

export default class ServiceArgResolver {

    canResolveArg (argDefinition) {
        return argDefinition.substring(0, 1) === '@';
    }

    resolveArg (argDefinition, extensionApi) {

        const [serviceName, ...path] = argDefinition.substring(1).split('.');

        return extensionApi.container.get(serviceName).then((service) => {

            if (!path.length) {
                return service;
            }

            return _.get(service, path.join('.'));

        });

    }

    lintArg (argDefinition, extensionApi) {

        const [serviceName] = argDefinition.substring(1).split('.');

        return Promise.resolve().then(() => {

            if (_.has(extensionApi.container.config.services, serviceName)) {
                return [];
            }

            return [`Missing service definition for ${argDefinition}`];

        });
    }

}
