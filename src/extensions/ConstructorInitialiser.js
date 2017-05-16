/**
 * Initialise the module with any args using "new".
 */
export default class ConstructorInitialiser {

    canInitialise (extensionApi) {
        return extensionApi.serviceDefinition.init === 'constructor';
    }

    initialise (instanceCreatedCallback, loadedModule) {

        const instance = new (Function.bind.apply(
            loadedModule,
            Array.prototype.slice.call(arguments, 1)
        ))();

        if (loadedModule.length !== (arguments.length - 2)) {
            // eslint-disable-next-line no-undef
            console.warn(
                '👉 "%s" has been initialised with %d parameter(s). Constructor takes %d parameter(s).',
                // eslint-disable-next-line no-underscore-dangle
                loadedModule.prototype.__moduleId__,
                arguments.length - 2,
                loadedModule.length
            );
        }

        instanceCreatedCallback(instance);

        return instance;
    }

}
