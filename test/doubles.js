/* eslint no-unused-vars: 0 */
import * as sinon from 'sinon';

export const containerDoubles = {

    container (params) {

        params = params || {};

        return sinon.stub({
            argResolvers: params.argResolvers || [],
            cache: {},
            chain: [],
            config: {
                services: {},
                params: {}
            },
            get (serviceId) {}
        });
    },

    moduleLoader () {
        return sinon.stub({
            canLoadModule (extensionApi) {},
            loadModule (extensionApi) {},
            lint (extensionApi) {}
        });
    },

    argResolver () {
        return sinon.stub({
            canResolveArg (argDefinition) {},
            resolveArg (argDefinition, extensionApi) {},
            lint (argDefinition, extensionApi) {}
        });
    },

    initialiser () {
        return sinon.stub({
            canInitialise (extensionApi) {},
            initialise (instanceCreatedCallback, loadedModule) {}
        });
    },

    extraHandler () {
        return sinon.stub({
            canHandleExtra (extraDefinition, extensionApi) {},
            beforeServiceInitialised (extraDefinition, extensionApi) {},
            onServiceInitialised (instance, extraDefinition, extensionApi) {},
            onServiceInstanceCreated (instance, extraDefinition, extensionApi) {},
            onGetComplete (extraDefinition, extensionApi) {}
        });
    },

    extensionApi (params) {

        params = params || {};

        return sinon.stub({
            serviceId: params.serviceId,
            serviceDefinition: params.serviceDefinition,
            container: this.container(),
            resolveArgs () {},
            resolveArg () {},
            getArgResolver () {}
        });

    },

    subscriptionManager () {
        return sinon.stub({
            add (handler, methodName, callbacks) {},
            start (target) {},
            stop (target) {},
            dispose (target) {}
        });
    },

    subscriptionManagerCallbacks () {
        return sinon.stub({
            start (callback) {},
            stop () {}
        });
    }

};
