import { _ } from '../globals';

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

}
