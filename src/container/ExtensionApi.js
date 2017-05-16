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
        return this.resolveArgs([argDefinition])[0];
    }

}
