# js-compose

A dependency injection container library using a plain javascript object dsl for describing the dependencies and their configuration.


## Architecture

Most of the work of a js-compose container is done by extensions. Some terminology has been introduced to capture certain roles that extensions can play in the definition and creation of a service.

    - Loader, or Module Loader
    - Arg Resolver 
    - Initialiser 
    - Extra Handler

**Loaders** are responsible for retrieving the primitive that will be used as a base to initialise the service, most typically a `Function`, but potentially anything.

**Arg Resolvers** enhance the composition configuration with a dsl for resolving dependencies for a service.

**Initialisers** are responsible for creating the service from the base provided by Loaders, and the dependencies provided by Arg Resolvers.

**Extra Handlers** add extra functionality by hooking into lifecycle hooks of the service provided by the container. They facilitate the use of aspect oriented programming patterns.
