import { _, Promise } from '../globals';

const COMMON_ARGS = {
    emptyString: '',
    true: true,
    false: false,
    noop: _.noop
};

/**
 * Use this to add some common args to the container.
 */
export default class CommonArgResolver {

    canResolveArg (argDefinition) {
        return argDefinition === 'container' || _.has(COMMON_ARGS, argDefinition);
    }

    resolveArg (argDefinition, extensionApi) {
        return Promise.resolve(
            argDefinition === 'container' ? extensionApi.container : COMMON_ARGS[argDefinition]
        );
    }

}
