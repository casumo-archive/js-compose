(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports', '../globals'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require('../globals'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.globals);
        global.CommonJSModuleLoader = mod.exports;
    }
})(this, function (exports, _globals) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });


    /**
     * Use this to load modules with CommonJS require
     */
    class CommonJSModuleLoader {

        constructor(require) {
            this.require = require;
        }

        canLoadModule(extensionApi) {
            return !!extensionApi.serviceDefinition.commonJS;
        }

        loadModule(extensionApi) {

            const [modulePath, exportName] = extensionApi.serviceDefinition.commonJS.split('.');
            const requiredModule = this.require(`./${modulePath}`);

            return _globals.Promise.resolve(exportName ? requiredModule[exportName] : requiredModule);
        }

    }
    exports.default = CommonJSModuleLoader;
});