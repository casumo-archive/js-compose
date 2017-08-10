import { Promise } from '../globals';

/**
 * Use this to load modules with CommonJS require
 */
export default class CommonJSModuleLoader {

    constructor (require) {
        this.require = require;
    }

    canLoadModule (extensionApi) {
        return !!extensionApi.serviceDefinition.module;
    }

    loadModule (extensionApi) {

        const module = extensionApi.serviceDefinition.module;
        const property = extensionApi.serviceDefinition.property;

        return Promise.resolve(property ? module[property] : module);
    }

}
