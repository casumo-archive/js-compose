import { _ } from '../globals';

/**
 * This is passed to most of the extension functions
 */
export default class ExtensionApi {

    constructor (container, serviceId, serviceDefinition, resolveArgs) {

        this.container = _.extend({}, container, {
            chain: container.chain.concat(serviceId)
        });

        this.unsafeContainer = container;

        this.serviceId = serviceId;
        this.serviceDefinition = serviceDefinition;

        /**
         * @param {Array<*>} argDefinitions
         *
         * @return {Array<Promise>}
         */
        this.resolveArgs = resolveArgs;

    }

    /**
     * @param {*} argDefinition
     *
     * @return {Promise}
     */
    resolveArg (argDefinition) {
        return new Promise((resolve) => {
            resolve(this.getArgResolver(argDefinition).resolveArg(argDefinition));
        });
    }

    /**
     * @param {*} argDefinition
     *
     * @throws {Error} - When there is no arg resolver for the definition
     *
     * @return {ArgResolver}
     */
    getArgResolver (argDefinition) {

        const { argResolvers } = this.container;

        const argResolver =  _.find(argResolvers, (r) => r.canResolveArg(argDefinition));

        if (!argResolver) {
            throw new Error(`No arg resolver for ${argDefinition}`);
        }

        return argResolver;

    }

}
