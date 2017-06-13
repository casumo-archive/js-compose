# js-compose

A dependency injection container library using a plain javascript object DSL for describing the dependencies and their configuration.

 - [Architecture](#Architecture)
 - [API](#API)
 - [Composition Configuration](#Composition%20Configuration)


## Architecture

Most of the work of a js-compose container is done by extensions. Some terminology has been introduced to capture certain roles that extensions can play in the definition and creation of a service.

- Loader, or Module Loader
- Arg Resolver 
- Initialiser 
- Extra Handler

**Loaders** are responsible for retrieving the primitive that will be used as a base to initialise the service, most typically a `Function`, but potentially anything.

**Arg Resolvers** enhance the composition configuration with a DSL for resolving dependencies for a service.

**Initialisers** are responsible for creating the service from the base provided by Loaders, and the dependencies provided by Arg Resolvers.

**Extra Handlers** add extra functionality by hooking into lifecycle hooks of the service provided by the container. They facilitate the use of aspect oriented programming patterns.

* * * * *

### extension.loadModule(extensionApi)

The first extension where `canLoadModule(extensionApi) === true` will be used as the Loader for the service. Returns a `Promise` of the module.


### extension.resolveArg(argDefinition, extensionApi)

The service definition can optionally include an `args` property as an array. Each item will be passed to the first extension where `canResolveArg(argDefinition) === true`. Returns a `Promise` for the resolved arg.


### extension.beforeServiceInitialised(extraDefinition, extensionApi)

The service definition can optionally include an `extras` property as an array. Each item will be passed to the first extension where `canHandleExtra(extraDefinition, extensionApi) === true` for all lifecycle hooks.

The `beforeServiceInitialised` hook is called after loading the module and resolving args, but before initialising the service. It can optionally return a `Promise` if asynchronous work is necessary.


### extension.initialise(instanceCreatedCallback, loadedModule, ...resolvedArgs)

The first extension where `canInitialise(extensionApi) === true` will be used as the Initialiser for the service. Returns the complete service, as it will be returned from the container.

The `instanceCreatedCallback` should be called with any instance created by this service. If the Initialiser returns a factory capable of creating multiple instances, this can be called multiple times. If the Initialiser is not responsible for creating new instances, this callback can be skipped.


### extension.onServiceInstanceCreated(instance, extraDefinition, extensionApi)

The service definition can optionally include an `extras` property as an array. Each item will be passed to the first extension where `canHandleExtra(extraDefinition, extensionApi) === true` for all lifecycle hooks.

The `onServiceInstanceCreated` hook is called whenever an instance of a service is created. Any return value is ignored. It is useful for aspect-oriented programming patterns.


### extension.onServiceInitialised(initialisedService, extraDefinition, extensionApi)

The service definition can optionally include an `extras` property as an array. Each item will be passed to the first extension where `canHandleExtra(extraDefinition, extensionApi) === true` for all lifecycle hooks.

The `onServiceInitialised` hook is called after the service is initialised. It is useful for extending services which don't create instances, or where asynchronous work is needed, as it can optionally return a `Promise`.


### extension.onGetComplete(extraDefinition, extensionApi)

The service definition can optionally include an `extras` property as an array. Each item will be passed to the first extension where `canHandleExtra(extraDefinition, extensionApi) === true` for all lifecycle hooks.

The `onGetComplete` hook is called at the end of every call to `container.get()`, immediately before returning, even if the service already existed in the cache. Any return value is ignored.


## API

### new Container(extensions: Array<Extension>, config: Object)

A Container instance is constructed with all extensions and complete configuration. The order of extensions is relevant when deciding which to use for steps detailed in the Architecture section above.


### container.get(id: String): Promise<Any>

Returns a promise for the service with the given id. Subsequent calls for the same id will return the same promise unless affected by an extension.


### container.cache: Object

The cache for the container is a dictionary of service name to `Promise`. Unstable API.


### container.config: Object

The config given when constructing this container instance. Unstable API.


### Container.defaultInitialiser(extension: Extension): Extension

A static utility function exposed on the Container constructor. Using this will make an extension always return true for `canInitialise` checks, meaning there is no need to include the `init` param in the service definition, making it the "default". Only one extension should be added using this, and it should be at the bottom of the extensions list.


### extensionAPI.container: Container

An instance of the container. Can be used to get services inside extensions, access the cache, or the full configuration.


### extensionAPI.unsafeContainer: Container

An instance of the container without circular dependency checks. Use with caution!


### extensionAPI.serviceId: String

The id of the service being loaded, as defined as the key in the services configuration object.


### extensionAPI.serviceDefinition: Object

The definition of the service being loaded, as defined as the value in the services configuration object.


### extensionAPI.resolveArgs(args: Array<Any>): Array<Promise<Any>>

Use this to resolve args in an extension.


## Composition Configuration

The second parameter to the `Container` constructor is a composition configuration. This is where you define your application using the DSL provided by extensions. Below is the built-in structure of this configuration. On its own it's not very useful. Extensions are required to support additional structure and do the heavy lifting.

```js
return {
    services: {

        // serviceId: serviceDefinition
        exampleService: {

            // Both args and extras are optional, and items in the lists can be
            // any type, but there must be an Extension capable of handling
            // each of them or the Promise for the service will reject.
            args: [],
            extras: []
        }

    }
};
```

The following extensions can be found in `src/extensions`.


### ??? Loader

@todo Add a general purpose loader


### FactoryServiceLoader

Use this to use another service as a factory, by providing the name of the service as the `factoryService` key in the definition. Also supports dot notation to use a property of the service. Any property that is a function will be returned with its context bound to its object.

```js
return {
    services: {
        exampleService: {
            factoryService: 'exampleFactory.createService'
        },
        exampleFactory: {
        }
    }
};
```


### Basic Initialisers

The ConstructorInitialiser, FactoryInitialiser and ReturnInitialiser add support for the `init` property in the service definition:

```js
return {
    services: {
        exampleService: {
            init: 'constructor' || 'factory' || 'return'
        }
    }
};
```

**ConstructorInitialiser** will call new on the loaded module with any resolved args.

**FactoryInitialiser** will invoke the loaded module with any resolved args.

**ReturnInitialiser** will ignore any args and return the loaded module as-is.


### PartialInitialiser

PartialInitialiser will be used if the `init` property equals "partial". Partial services will partially apply any resolved args to the loaded module. It will preserve any constructor prototype semantics from the original function.

```js
return {
    services: {
        exampleService: {
            init: 'partial',
            args: [/* ... */]
        }
    }
};
```


### ServiceArgResolver

Use this to inject other services as dependencies by using the `@` prefix.

Also supports dot notation to access nested properties of the dependee service, although this is not considered to be best practice.

```js
return {
    services: {
        exampleService: {
            args: ['@dependeeService']
        },
        dependeeService: {
            // ...
        }
    }
};
```


### ParamArgResolver

Use this to inject arbitrary parameters as dependencies by using the `%` prefix. Parameters are not defined where they are injected as it makes static validation of container configuration impossible.

Also supports dot notation to access nested values of the params configuration object.

```js
return {

    params: {
        exampleParam: 'foo'
    },

    services: {
        exampleService: {
            args: ['%exampleParam']
        }
    }
};
```


### DeferredArgResolver

Use this to resolve circular dependencies between services by using the `defer:` prefix. Note, circular dependencies are often a sign of bad design, in particular leaking abstraction layers.

```js
return {
    services: {
        exampleService: {
            args: ['defer:@circularDependency']
        },
        circularDependency: {
            args: ['@exampleService']
        }
    }
};
```

```js
class ExampleService {

    constructor (circularDependency) {
        this.circularDependency = circularDependency;
    }

    doSomething () {
        return this.circularDependency().then((circularDependency) => {
            return circularDependency.something();
        });
    }

}
```


### CommonArgResolver

Provides a number of args that are useful in many applications. All available args are added to the service below. They are hopefully self-explanatory.

```js
return {
    services: {
        exampleService: {
            args: [
                'container',
                'emptyString',
                'true',
                'false',
                'noop'
            ]
        }
    }
};
```


### AliasExtension

Use this to give an alias to a resolved arg so that it can be used as a service.

```js
return {
    services: {
        exampleService: {
            // See [ServiceArgResolver](#ServiceArgResolver)
            alias: '@otherService'
        },
        otherService: {
        }
    }
};
```


### NoCacheExtension

Use this to return a new, unique instance of this service every time it is got from the container.

```js
return {
    services: {
        exampleService: {
            extras: [
                'no-cache'
            ]
        }
    }
};
```


### StructuredArgExtension

Use this to create a structured tree of dependencies as a service by using the `structuredArg` key in the service definition. It will recursively resolve all args at the leaves of the tree before resolving the service.

```js
return {
    services: {
        exampleTreeService: {
            structuredArg: {
                fooService: '@foo',
                barServices: ['@bar1', '@bar2']
            }
        },
        foo: { /* ... */ },
        bar1: { /* ... */ }
        bar2: { /* ... */ }
    }
};
```

```js
const example = await container.get('exampleTreeService');

(example.fooService instanceof Foo) === true
(example.barServices[0] instanceof Bar) === true
(example.barServices[1] instanceof Bar) === true
```


### PubSubExtension

Use this extension as an event bus for your application. It makes it possible to configure subscriptions to events in the container configuration, and to easily publish events from services.

#### Subscribe

Event subscriptions should be configured by an object with the `subscribe` key added to the extras definition. Two styles are supported.

The first is an object with the event name as the key, and the handler method name as the value:

```js
return {
    services: {
        exampleSubscriber: {
            extras: [
                {
                    subscribe: {
                        onExampleEvent: 'handleExampleEvent'
                    }
                }
            ]
        }
    }
};
```

The second is string matching the event name. The service itself will be used as the handler, and should therefore be invokable.

```js
return {
    services: {
        exampleSubscriber: {
            extras: [
                {
                    subscribe: 'onExampleEvent'
                }
            ]
        }
    }
};
```

#### Publish

Publishing events is achieved by configuring an arg with the prefix `publish:`:

```js
return {
    services: {
        examplePublisher: {
            args: ['publish:exampleEvent']
        }
    }
};
```

This will resolve to a function which when called will publish the event to all subscribers. Any subscribers configured in the container using the approach above will be initialised before the event is published down the event bus. This is a great way for events to lazily initialise parts of your application.

```js
class ExamplePublisher {

    constructor (publishExampleEvent) {

        publishExampleEvent(this).then(() => {
            // Subscribers have been loaded and notified with this instance as a payload
        });

    }
}
```


### SubscriptionManagerExtension

This extension is a supporting module for extensions which manage callback subscriptions. An instance of this extension can be passed in the constructor of others to manage subscriptions. When added to the container it exposes the `subscriptionManager` service so that services can manage subscriptions too.

The following sections will explain the API for the SubscriptionManagerExtension.


#### subscriptionManager.add()

Use this to make the subscription manager responsible for a subscription. It won't start the subscription. Subscription handlers can either be a method on an object, or a function. Below are the interfaces:

```js
// Subscribe to a method on a handler object
{
    add (handlerObject: Object, handlerMethod: String, callbacks: Object) {}
}

// Subscribe to a handler function directly
{
    add (handlerFunction: Function, ignored: Null, callbacks: Object) {}
}
```

The callbacks object is implemented by the extension that is creating the subscriptions. Below is an example of how a timer extension might implement the callbacks object to invoke managed handlers every second:

```js
const callbacks = {

    start (callback) {
        this.timer = window.setInterval(() => callback(Date.now()), 1000);
    }

    stop () {
        window.clearInterval(this.timer);
    }

};
```

The extension would need to register subscriptions with the subscription manager at some point during the container lifecycle for a service. Extra Handlers can interact with services as they are composed. Either of the interfaces described above can be used to register the subscription:

```js
// Invoke onInterval with timestamp on the service every second
subscriptionManager.add(service, 'onInterval', callbacks);

// Log the timestamp and the service every second
subscriptionManager.add(
    (timestamp) => console.log(timestamp, service),
    null,
    callbacks
);
```


#### subscriptionManager.start()

Use this to start subscriptions managed by this extension. There are three ways to do so:

```js
// Start a registered subscription for a single handler function
function exampleHandlerFunction () {}

subscriptionManager.add(exampleHandlerFunction, null, callbacks);

// Invoke start with a registered handler function
subscriptionManager.start(exampleHandlerFunction);
```

```js
// Start a registered subscription for a handler method
const exampleHandlerObject = {
    handlerMethod () {}
};

subscriptionManager.add(exampleHandlerObject, 'handlerMethod', callbacks);

// Invoke start with a registered handler object and method name string
subscriptionManager.start(exampleHandlerObject, 'handlerMethod');

// Or alternatively invoke start with the method function
subscriptionManager.start(exampleHandlerObject.handlerMethod);
```

```js
// Start all registered subscriptions for a handler object
const exampleHandlerObject = {
    handlerMethod01 () {},
    handlerMethod02 () {}
};

subscriptionManager.add(exampleHandlerObject, 'handlerMethod01', callbacks);
subscriptionManager.add(exampleHandlerObject, 'handlerMethod02', callbacks);

// Invoke start with a registered handler object only
subscriptionManager.start(exampleHandlerObject);
```


#### subscriptionManager.stop()

Use this to stop subscriptions managed by this extension. Supports the same three interfaces as [subscriptionManager.start()](#subscriptionManager.start()).


#### subscriptionManager.dispose()

Use this to stop and unregister subscriptions managed by this extension. Any future call to start will have no effect. Supports the same three interfaces as [subscriptionManager.start()](#subscriptionManager.start()).
