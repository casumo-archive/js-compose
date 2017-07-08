import { _ } from '../globals';
import { ArgError } from './errors';

/**
 * This is passed to most of the extension functions
 */
export default class ExtensionApi {

    constructor (container, serviceId, serviceDefinition) {

        this.container = _.extend({}, container, {
            chain: container.chain.concat(serviceId)
        });

        this.unsafeContainer = container;

        this.serviceId = serviceId;
        this.serviceDefinition = serviceDefinition;

    }

    /**
     * @param {*} argDefinition
     *
     * @return {Promise}
     */
    resolveArg (argDefinition) {

        return Promise.resolve()
            .then(() => this.getArgResolver(argDefinition).resolveArg(argDefinition, this))
            .catch((e) => {
                throw new ArgError(argDefinition, e);
            });

    }

    /**
     * @param {Array<*>} argDefinitions
     *
     * @return {Array<Promise>}
     */
    resolveArgs (argDefinitions) {
        return argDefinitions.map((argDefinition) => this.resolveArg(argDefinition));
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
            throw new Error('No arg resolver');
        }

        return argResolver;

    }

}
