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

}
