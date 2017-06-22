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
        global.FactoryServiceLoader = mod.exports;
    }
})(this, function (exports, _globals) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });


    /**
     * Use this to use an existing service, or its property as a factory for other services.
     *
     * Service definition usage examples:
     *
     *      { factoryService: 'nameOfService' }
     *      { factoryService: 'nameOfService.propertyName' }
     */
    class FactoryServiceLoader {

        canLoadModule(extensionApi) {
            return !!extensionApi.serviceDefinition.factoryService;
        }

        loadModule(extensionApi) {

            const [serviceId, propertyName] = extensionApi.serviceDefinition.factoryService.split('.');

            return extensionApi.container.get(serviceId).then(instance => {

                if (!propertyName) {
                    return instance;
                }

                if (!instance[propertyName]) {
                    throw new Error(`Service "${serviceId}" has no property "${propertyName}".`);
                }

                if (_globals._.isFunction(instance[propertyName])) {
                    return instance[propertyName].bind(instance);
                }

                return instance[propertyName];
            });
        }

    }
    exports.default = FactoryServiceLoader;
});