import { _, Promise } from '../globals';

export default class PubSubExtension {

    constructor (eventBusServiceId) {
        this.eventBusServiceId = eventBusServiceId;
    }

    canResolveArg (argDefinition) {
        return argDefinition.substring(0, 8) === 'publish:';
    }

    resolveArg (argDefinition, extensionApi) {

        var container = extensionApi.container;
        var eventName = argDefinition.substring(8);

        var dependeeIds = _.reduce(
            container.config.services,
            function(memo, definition, id) {
                if (!definition.extras) {
                    return memo;
                }

                if (
                    !_.find(definition.extras, function(extraDefinition) {
                        return extraDefinition.subscribe &&
                            (extraDefinition.subscribe === eventName || _.has(extraDefinition.subscribe, eventName));
                    })
                ) {
                    return memo;
                }

                return memo.concat(id);
            },
            []
        );

        return container.get(this.eventBusServiceId).then(function(eventBus) {

            return function(payload) {
                return Promise.all(
                    _.map(dependeeIds, function(id) {
                        return container.get(id);
                    })
                ).then(function() {
                    eventBus.trigger(argDefinition.substring(8), payload);
                });
            };
        });
    }

    canHandleExtra (extraDefinition) {
        return !!extraDefinition.subscribe;
    }

    beforeServiceInitialised (extraDefinition, extensionApi) {

        return Promise.all([
            extensionApi.resolveArg('subscriptionManager'),
            extensionApi.container.get(this.eventBusServiceId)
        ]).then(function ([subscriptionManager, eventBus]) {
            this.subscriptionManager = subscriptionManager;
            this.eventBus = eventBus;
        }.bind(this));

    }

    createSubscriptions (instance, eventNamesToMethodNames) {

        var subscriptionManager = this.subscriptionManager,
            eventBus = this.eventBus;

        _.each(eventNamesToMethodNames, function(methodName, eventName) {

            var subscription;

            subscriptionManager.add(instance, methodName, {
                start: function(callback) {
                    subscription = eventBus.on(eventName).then(callback);
                },
                stop: function() {
                    subscription.off();
                }
            });

            subscriptionManager.start(instance, methodName);

        });

    }

    onServiceInstanceCreated (instance, extraDefinition, extensionApi) {

        if (!_.isString(extraDefinition.subscribe)) {
            this.createSubscriptions(instance, extraDefinition.subscribe);
        }

    }

    onServiceInitialised (instance, extraDefinition, extensionApi) {

        var eventNamesToMethodNames = {};

        // If it's a string then the instance is a handler function
        if (_.isString(extraDefinition.subscribe)) {
            eventNamesToMethodNames[extraDefinition.subscribe] = null;
            this.createSubscriptions(instance, eventNamesToMethodNames);
        }

    }

}
