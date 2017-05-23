import { _, Promise } from '../globals';

export default class SubscriptionManagerExtension {

    constructor () {
        this.managedSubscriptions = [];
    }

    canResolveArg (argDefinition) {
        return argDefinition === 'subscriptionManager';
    }

    resolveArg () {
        return Promise.resolve(this);
    }

    /**
     * @param {Function | Object} handler
     * @param {String | Null} methodName
     * @param {Object} callbacks
     */
    add (handler, methodName, callbacks) {

        this.managedSubscriptions = this.managedSubscriptions.concat(
            _.extend(
                {
                    handler,
                    methodName
                },
                callbacks
            )
        );

    }

    /**
     * Use this to start all subscriptions for a handler object, or a specific subscription of a handler
     * function
     *
     * @param {Function | Object} handlerOrMethod
     * @param {String} [methodName]
     */
    start (handlerOrMethod, methodName) {

        manageSubscriptions.call(this, handlerOrMethod, methodName, (managedSubscription) => {

            const { handler, methodName } = managedSubscription;

            managedSubscription.start((payload) => {

                if (methodName) {
                    handler[methodName](payload);
                } else {
                    handler(payload);
                }

            });

        });

    }

    /**
     * Use this to stop all subscriptions for a handler object, or a specific subscription of a handler
     * function
     *
     * @param {Function | Object} handlerOrMethod
     * @param {String} [methodName]
     */
    stop (handlerOrMethod, methodName) {
        manageSubscriptions.call(this, handlerOrMethod, methodName, (managedSubscription) => {
            managedSubscription.stop();
        });
    }

    /**
     * Use this to dispose all subscriptions for a handler object, or a specific subscription of a
     * handler function
     *
     * Further attempts to start them again will do nothing
     *
     * @param {Function | Object} handlerOrMethod
     * @param {String} [methodName]
     */
    dispose (handlerOrMethod, methodName) {
        manageSubscriptions.call(this, handlerOrMethod, methodName,  (managedSubscription) => {
            managedSubscription.stop();
            this.managedSubscriptions = _.without(this.managedSubscriptions, managedSubscription);
        });
    }

}

function manageSubscriptions (handlerOrMethod, methodName, iteratee) {

    const handler = handlerOrMethod;
    const method = handlerOrMethod;

    this.managedSubscriptions.forEach((subscription) => {

        if (
            subscription.handler === handler && !methodName ||
            subscription.handler === handler && subscription.methodName === methodName ||
            subscription.handler[subscription.methodName] === method
        ) {
            iteratee(subscription);
        }

    });

}
