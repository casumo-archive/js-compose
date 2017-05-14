import * as sinon from 'sinon';

export const containerDoubles = {

    container: function() {
        return sinon.stub({
            cache: {},
            get: function(serviceId) {}
        });
    },

    moduleLoader: function() {
        return sinon.stub({
            canLoadModule: function(extensionApi) {},
            loadModule: function(extensionApi) {}
        });
    },

    argResolver: function() {
        return sinon.stub({
            canResolveArg: function(argDefinition) {},
            resolveArg: function(argDefinition, extensionApi) {}
        });
    },

    initialiser: function() {
        return sinon.stub({
            canInitialise: function(extensionApi) {},
            initialise: function(instanceCreatedCallback, loadedModule) {}
        });
    },

    extraHandler: function() {
        return sinon.stub({
            canHandleExtra: function(extraDefinition, extensionApi) {},
            beforeServiceInitialised: function(extraDefinition, extensionApi) {},
            onServiceInitialised: function(instance, extraDefinition, extensionApi) {},
            onServiceInstanceCreated: function(instance, extraDefinition, extensionApi) {},
            onGetComplete: function(extraDefinition, extensionApi) {}
        });
    },

    extensionApi: function(params) {

        params = params || {};

        return sinon.stub({
            serviceId: params.serviceId,
            serviceDefinition: params.serviceDefinition,
            container: this.container(),
            resolveArgs: function() {},
            resolveArg: function() {}
        });

    },

    subscriptionManager: function() {
        return sinon.stub({
            add: function(handler, methodName, callbacks) {},
            start: function(target) {},
            stop: function(target) {},
            dispose: function(target) {},
        });
    },

    subscriptionManagerCallbacks: function() {
        return sinon.stub({
            start: function(callback) {},
            stop: function() {}
        });
    }

};
