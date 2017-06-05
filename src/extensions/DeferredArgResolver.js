import { _, Promise } from '../globals';

export default class DeferredArgResolver {

    canResolveArg (argDefinition) {
        return argDefinition.substring(0, 6) === 'defer:';
    }

    resolveArg (argDefinition, extensionApi) {

        return _.constant(new Promise((resolve, reject) => {

            _.defer(() => {
                extensionApi.resolveArg(argDefinition.substring(6)).then(resolve, reject);
            });

        }));

    }

}
