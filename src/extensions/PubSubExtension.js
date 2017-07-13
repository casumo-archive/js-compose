import { _, Promise } from '../globals';

export default class PubSubExtension {

    constructor (eventBusServiceId) {
        this.eventBusServiceId = eventBusServiceId;
    }

    canResolveArg (argDefinition) {
        return argDefinition.substring(0, 8) === 'publish:';
    }

    resolveArg (argDefinition, extensionApi) {

        const { container } = extensionApi;
        const eventName = argDefinition.substring(8);

        const dependeeIds = _.reduce(
            container.config.services,
            (memo, definition, id) => {
                if (!definition.extras) {
                    return memo;
                }

                if (
                    !_.find(definition.extras, (extraDefinition) => {
                        return extraDefinition.subscribe && (
                            extraDefinition.subscribe === eventName ||
                            _.has(extraDefinition.subscribe, eventName)
                        );
                    })
                ) {
                    return memo;
                }

                return memo.concat(id);
            },
            []
        );

        return container.get(this.eventBusServiceId).then((eventBus) => {

            return (payload) => {
                return Promise.all(
                    _.map(dependeeIds, (id) => {
                        return container.get(id);
                    })
                ).then(() => {
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
        ]).then(([subscriptionManager, eventBus]) => {
            this.subscriptionManager = subscriptionManager;
            this.eventBus = eventBus;
        });

    }

    createSubscriptions (instance, eventNamesToMethodNames) {

        const { eventBus, subscriptionManager } = this;

        _.each(eventNamesToMethodNames, (methodName, eventName) => {

            let subscription;

            subscriptionManager.add(instance, methodName, {
                start (callback) {
                    subscription = eventBus.on(eventName).then(callback);
                },
                stop () {
                    subscription.off();
                }
            });

            subscriptionManager.start(instance, methodName);

        });

    }

    onServiceInstanceCreated (instance, extraDefinition) {

        if (!_.isString(extraDefinition.subscribe)) {
            this.createSubscriptions(instance, extraDefinition.subscribe);
        }

    }

    onServiceInitialised (instance, extraDefinition) {

        const eventNamesToMethodNames = {};

        // If it's a string then the instance is a handler function
        if (_.isString(extraDefinition.subscribe)) {
            eventNamesToMethodNames[extraDefinition.subscribe] = null;
            this.createSubscriptions(instance, eventNamesToMethodNames);
        }

    }

    lint (argDefinition, extensionApi) {

        const eventName = argDefinition.substring(8);

        const subscriptionEventNames = _(extensionApi.container.config.services)
            .flatMap('extras')
            .map('subscribe')
            .compact()
            .flatMap((subscriptionDefinition) => {
                if (_.isObject(subscriptionDefinition)) {
                    return _.keys(subscriptionDefinition);
                }

                return [subscriptionDefinition];
            })
            .value();

        return Promise.resolve().then(() => {

            if (_.includes(subscriptionEventNames, eventName)) {
                return [];
            }

            return [`Missing matching subscription for ${eventName} publisher`];

        });

    }

}
