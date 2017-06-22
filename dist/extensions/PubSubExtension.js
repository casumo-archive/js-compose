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
        global.PubSubExtension = mod.exports;
    }
})(this, function (exports, _globals) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    class PubSubExtension {

        constructor(eventBusServiceId) {
            this.eventBusServiceId = eventBusServiceId;
        }

        canResolveArg(argDefinition) {
            return argDefinition.substring(0, 8) === 'publish:';
        }

        resolveArg(argDefinition, extensionApi) {

            const { container } = extensionApi;
            const eventName = argDefinition.substring(8);

            const dependeeIds = _globals._.reduce(container.config.services, (memo, definition, id) => {
                if (!definition.extras) {
                    return memo;
                }

                if (!_globals._.find(definition.extras, extraDefinition => {
                    return extraDefinition.subscribe && (extraDefinition.subscribe === eventName || _globals._.has(extraDefinition.subscribe, eventName));
                })) {
                    return memo;
                }

                return memo.concat(id);
            }, []);

            return container.get(this.eventBusServiceId).then(eventBus => {

                return payload => {
                    return _globals.Promise.all(_globals._.map(dependeeIds, id => {
                        return container.get(id);
                    })).then(() => {
                        eventBus.trigger(argDefinition.substring(8), payload);
                    });
                };
            });
        }

        canHandleExtra(extraDefinition) {
            return !!extraDefinition.subscribe;
        }

        beforeServiceInitialised(extraDefinition, extensionApi) {

            return _globals.Promise.all([extensionApi.resolveArg('subscriptionManager'), extensionApi.container.get(this.eventBusServiceId)]).then(([subscriptionManager, eventBus]) => {
                this.subscriptionManager = subscriptionManager;
                this.eventBus = eventBus;
            });
        }

        createSubscriptions(instance, eventNamesToMethodNames) {

            const { eventBus, subscriptionManager } = this;

            _globals._.each(eventNamesToMethodNames, (methodName, eventName) => {

                let subscription;

                subscriptionManager.add(instance, methodName, {
                    start(callback) {
                        subscription = eventBus.on(eventName).then(callback);
                    },
                    stop() {
                        subscription.off();
                    }
                });

                subscriptionManager.start(instance, methodName);
            });
        }

        onServiceInstanceCreated(instance, extraDefinition) {

            if (!_globals._.isString(extraDefinition.subscribe)) {
                this.createSubscriptions(instance, extraDefinition.subscribe);
            }
        }

        onServiceInitialised(instance, extraDefinition) {

            const eventNamesToMethodNames = {};

            // If it's a string then the instance is a handler function
            if (_globals._.isString(extraDefinition.subscribe)) {
                eventNamesToMethodNames[extraDefinition.subscribe] = null;
                this.createSubscriptions(instance, eventNamesToMethodNames);
            }
        }

    }
    exports.default = PubSubExtension;
});