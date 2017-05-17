/**
 * Initialise the module with any args using "new".
 */
export default class ConstructorInitialiser {

    canInitialise (extensionApi) {
        return extensionApi.serviceDefinition.init === 'constructor';
    }

    initialise (instanceCreatedCallback, Constructor, ...args) {

        const instance = new Constructor(...args);

        if (Constructor.length !== args.length) {
            // eslint-disable-next-line no-undef
            console.warn(
                '👉 "%s" has been initialised with %d parameter(s). Constructor takes %d parameter(s).',
                // eslint-disable-next-line no-underscore-dangle
                Constructor.prototype.__moduleId__,
                args.length,
                Constructor.length
            );
        }

        instanceCreatedCallback(instance);

        return instance;
    }

}
