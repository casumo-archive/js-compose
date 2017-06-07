# js-compose

A dependency injection container library using a plain javascript object DSL for describing the dependencies and their configuration.


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

Returns a promise for the service with the given id.


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

Use this to resolve circular dependencies between services. Note, circular dependencies are often a sign of bad design, in particular leaking abstraction layers.

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
