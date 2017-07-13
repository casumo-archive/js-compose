import { _, Promise } from '../globals';

export default class ParamArgResolver {

    canResolveArg (argDefinition) {
        return argDefinition.substring(0, 1) === '%';
    }

    resolveArg (argDefinition, extensionApi) {
        return Promise.resolve(
            _.get(extensionApi.container.config.params, argDefinition.substring(1))
        );
    }

    lintArg (argDefinition, extensionApi) {
        return Promise.resolve().then(() => {

            const paramPath = argDefinition.substring(1);

            if (_.has(extensionApi.container.config.params, paramPath)) {
                return [];
            }

            return [`Missing param '${paramPath}'`];

        });
    }

}
