/**
 * Partially applies the loaded module with any args
 */
export default class PartialInitialiser {

    canInitialise (extensionApi) {
        return extensionApi.serviceDefinition.init === 'partial';
    }

    initialise (instanceCreatedCallback, Original, ...partialArgs) {

        // PartiallyApplied and Original aren't always constructors but the additional
        // modifications needed for constructors don't impact functions afaik
        function PartiallyApplied (...args) {

            const instance = Original.call(this, ...partialArgs, ...args);

            if (instance || this) {
                instanceCreatedCallback(instance || this);
            }

            return instance;

        }

        PartiallyApplied.prototype = Original.prototype;

        try {
            Object.defineProperty(PartiallyApplied, 'name', {
                value: Original.name
            });
        } catch (e) {
            // eslint-disable-next-line no-undef
            console.warn('Cannot redefine readonly name on Partial');
        }

        return PartiallyApplied;

    }

}
