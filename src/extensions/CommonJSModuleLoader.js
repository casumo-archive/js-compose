import { Promise } from '../globals';

/**
 * Use this to load modules with CommonJS require
 */
export default class CommonJSModuleLoader {

    constructor (require) {
        this.require = require;
    }

    canLoadModule (extensionApi) {
        return !!extensionApi.serviceDefinition.commonJS;
    }

    loadModule (extensionApi) {

        const [modulePath, exportName] = extensionApi.serviceDefinition.commonJS.split('.');
        const requiredModule = this.require(`./${modulePath}`);

        return Promise.resolve(exportName ? requiredModule[exportName] : requiredModule);

    }

}
