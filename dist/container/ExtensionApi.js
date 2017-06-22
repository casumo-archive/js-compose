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
        global.ExtensionApi = mod.exports;
    }
})(this, function (exports, _globals) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });


    /**
     * This is passed to most of the extension functions
     */
    class ExtensionApi {

        constructor(container, serviceId, serviceDefinition, resolveArgs) {

            this.container = _globals._.extend({}, container, {
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
        resolveArg(argDefinition) {
            return this.resolveArgs([argDefinition])[0];
        }

    }
    exports.default = ExtensionApi;
});