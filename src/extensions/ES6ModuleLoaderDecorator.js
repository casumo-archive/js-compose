/**
 * Use this to support ES6 default exports in other module loaders.
 *
 * Note. This implementation could have unexpected results if userland code
 * uses the key "default".
 */
export default class ES6ModuleLoaderDecorator {

    constructor (decorated) {
        this.decorated = decorated;
    }

    canLoadModule (extensionApi) {
        return this.decorated.canLoadModule(extensionApi);
    }

    loadModule (extensionApi) {

        return this.decorated.loadModule(extensionApi).then((loadedModule) => {

            if (loadedModule.default) {
                return loadedModule.default;
            }

            return loadedModule;

        });

    }

    lint (extensionApi) {

        if (!this.decorated.lint) {
            return;
        }

        return this.decorated.lint(extensionApi);

    }

}
