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
        return Promise.resolve(this.require(extensionApi.serviceDefinition.commonJS));
    }

}
