/* eslint-env mocha */

import { _, Promise } from '../globals';
import * as sinon from 'sinon';
import { containerDoubles } from '../../test/doubles';
import Container from './Container';
import { defaultInitialiser } from './Container';
import ExtensionApi from './ExtensionApi';

let definition,
    moduleLoader,
    argResolver,
    initialiser,
    extensionApi;

describe('Container', function () {

    beforeEach(function () {

        definition = {
            services: {
                exampleService: {}
            }
        };

        moduleLoader = containerDoubles.moduleLoader();
        moduleLoader.canLoadModule.returns(true);
        moduleLoader.loadModule.resolves(Object);

        argResolver = containerDoubles.argResolver();
        argResolver.canResolveArg.returns(true);
        argResolver.resolveArg.resolves(Object);

        initialiser = containerDoubles.initialiser();
        initialiser.canInitialise.returns(true);

        extensionApi = containerDoubles.extensionApi();

    });

    describe('defaultInitialiser', function () {

        it('makes the provided initialiser the default', function () {

            initialiser.canInitialise.returns(false);

            extensionApi.serviceDefinition = {};

            defaultInitialiser(initialiser).canInitialise(extensionApi).should.equal(true);

        });

        it('does not default if the init property is set', function () {

            var returned = {};

            initialiser.canInitialise.returns(returned);

            extensionApi.serviceDefinition = { init: 'example' };

            defaultInitialiser(initialiser).canInitialise(extensionApi).should.equal(returned);

        });

    });

    it('uses provided module loaders', function () {

        var result;

        var container = new Container(
            [ moduleLoader, initialiser ],
            definition
        );

        result = container.get('exampleService');

        moduleLoader.canLoadModule.should.have.been.calledWith( sinon.match.instanceOf(ExtensionApi) );

        moduleLoader.loadModule.should.have.been.calledWith( sinon.match.instanceOf(ExtensionApi) );

    });

    it('skips module loaders which can not load the service', function () {

        var uselessModuleLoader = containerDoubles.moduleLoader();

        uselessModuleLoader.canLoadModule.returns(false);

        var container = new Container(
            [ uselessModuleLoader, moduleLoader, initialiser ],
            definition
        );

        container.get('exampleService');

        uselessModuleLoader.loadModule.should.not.have.been.called;
        moduleLoader.loadModule.should.have.been.called;

    });

    it('rejects the promise if no valid module loader is available', function () {

        var container = new Container(
            [ initialiser ],
            definition
        );

        var result = container.get('exampleService');

        return result.should.eventually.be.rejected;

    });

    it('rejects the promise if no matching definition is found', function () {

        var container = new Container(
            [ moduleLoader, initialiser ],
            {
                services: {}
            }
        );

        var result = container.get('exampleService');

        return result.should.eventually.be.rejected;

    });

    it('only initialises one instance of a service', function () {

        var container = new Container(
            [ moduleLoader, initialiser ],
            definition
        );

        initialiser.initialise.returns({});

        return Promise.all([container.get('exampleService'), container.get('exampleService')]).then(_.spread(function(first, second) {
            first.should.equal(second);
            initialiser.initialise.should.have.been.calledOnce;
        }));

    });

    it('uses provided arg resolvers', function(done) {

        var container = new Container(
            [ moduleLoader, argResolver, initialiser ],
            {
                services: {
                    exampleService: {
                        args: ['foo', 'bar']
                    }
                }
            }
        );

        var exampleModule = function () {};

        moduleLoader.loadModule.resolves(exampleModule);

        argResolver.resolveArg.withArgs('foo').resolves(123);
        argResolver.resolveArg.withArgs('bar').resolves(456);

        container.get('exampleService').then(function () {

            initialiser.initialise.should.have.been.calledWith(sinon.match.func, exampleModule, 123, 456);
            done();

        });

    });

    it('skips arg resolvers which cannot resolve the arg', function () {

        var uselessArgResolver = containerDoubles.argResolver();

        var container = new Container(
            [ moduleLoader, uselessArgResolver, argResolver, initialiser ],
            {
                services: {
                    exampleService: {
                        args: ['foo']
                    }
                }
            }
        );

        uselessArgResolver.canResolveArg.returns(false);

        container.get('exampleService');

        uselessArgResolver.resolveArg.should.not.have.been.called;
        argResolver.resolveArg.should.have.been.called;

    });

    it('rejects the promise if no valid arg resolver is available', function () {

        var container = new Container(
            [ moduleLoader, argResolver, initialiser ],
            {
                services: {
                    exampleService: {
                        args: ['foo']
                    }
                }
            }
        );

        argResolver.canResolveArg.returns(false);

        return container.get('exampleService').should.eventually.be.rejected;

    });

    it('passes extension api to the arg resolvers', function(done) {

        var container = new Container(
            [ moduleLoader, argResolver, initialiser ],
            {
                services: {
                    exampleService: {
                        args: ['foo']
                    }
                }
            }
        );

        container.get('exampleService').then(function () {
            argResolver.resolveArg.should.have.been.calledWith(
                'foo',
                sinon.match.instanceOf(ExtensionApi)
            );
            done();
        });

    });

    it('adds argDefinition to rejected arg messages', function(done) {

        var container = new Container(
            [
                moduleLoader,
                {
                    canResolveArg: function () { return true; },
                    resolveArg: function(argDefinition, container) {
                        return Promise.reject(new Error('foobar'));
                    }
                },
                initialiser
            ],
            {
                services: {
                    exampleService: { args: ['meow'] }
                }
            }
        );

        container.get('exampleService').catch(function(error) {
            error.message.should.contain('foobar');
            error.message.should.contain('meow');
            done();
        });

    });

    it('uses provided initialisers', function(done) {

        var result;
        var exampleModule = function () {};
        var exampleInstance = {};

        var container = new Container(
            [ moduleLoader, argResolver, initialiser ],
            {
                services: {
                    exampleService: {
                        args: ['foo']
                    }
                }
            }
        );

        moduleLoader.loadModule.returns(exampleModule);
        argResolver.resolveArg.resolves(123);
        initialiser.initialise.returns(exampleInstance);

        container.get('exampleService').then(function(result) {
            result.should.equal(exampleInstance);
            initialiser.initialise.should.have.been.calledWith(sinon.match.func, exampleModule, 123);
            done();
        });

    });

    it('passes a callback to initialisers which notifies extras when an instance of a service is created', function () {

        var extraHandler = containerDoubles.extraHandler();
        var extraDefinition = {};

        var exampleModule = function () {};
        var exampleInstance = {};

        var container = new Container(
            [ moduleLoader, initialiser, extraHandler ],
            {
                services: {
                    exampleService: {
                        extras: [
                            extraDefinition
                        ]
                    }
                }
            }
        );

        moduleLoader.loadModule.returns(exampleModule);

        initialiser.initialise.callsArgWith(0, exampleInstance);

        extraHandler.canHandleExtra.returns(true);

        container.get('exampleService');

        return extraHandler.onServiceInstanceCreated.should.eventuallyBeCalled().then(_.spread(function () {

            extraHandler.onServiceInstanceCreated.should.have.been.calledWith(
                exampleInstance,
                extraDefinition,
                sinon.match.instanceOf(ExtensionApi)
            );

        }));

    });

    it('should call onServiceInstanceCreated synchronously when initialiser calls instanceCreatedCallback', function () {

        var extraHandler = containerDoubles.extraHandler(),
            exampleInstance = {},
            container;

        container = new Container(
            [ moduleLoader, initialiser, extraHandler ],
            {
                services: {
                    exampleService: {
                        extras: [
                            {}
                        ]
                    }
                }
            }
        );

        moduleLoader.loadModule.returns(function () {});

        extraHandler.canHandleExtra.returns(true);

        return container.get('exampleService').then(function () {

            initialiser.initialise.args[0][0](exampleInstance);

            extraHandler.onServiceInstanceCreated.should.have.been.calledWith(exampleInstance);

        });

    });

    it('skips initialisers which cannot load the service', function () {

        var uselessInitialiser = containerDoubles.initialiser();
        uselessInitialiser.canInitialise.returns(false);

        var container = new Container(
            [ moduleLoader, argResolver, uselessInitialiser, initialiser ],
            definition
        );

        return container.get('exampleService').then(function () {
            uselessInitialiser.initialise.should.not.have.been.called;
            initialiser.initialise.should.have.been.called;
        });

    });

    it('rejects the promise when no initialiser is available', function () {

        var uselessInitialiser = containerDoubles.initialiser();
        uselessInitialiser.canInitialise.returns(false);

        var container = new Container(
            [ moduleLoader, argResolver, uselessInitialiser ],
            definition
        );

        return container.get('exampleService').should.eventually.be.rejected;

    });

    it('notifies extra before a service is initialised', function () {

        var extraHandler = containerDoubles.extraHandler();
        var extraDefinition = {};

        var container = new Container(
            [ moduleLoader, initialiser, extraHandler ],
            {
                services: {
                    exampleService: {
                        extras: [
                            extraDefinition
                        ]
                    }
                }
            }
        );

        extraHandler.canHandleExtra.returns(true);
        extraHandler.beforeServiceInitialised.promises();

        container.get('exampleService');

        return extraHandler.beforeServiceInitialised.should.eventuallyBeCalled().then(function () {

            extraHandler.canHandleExtra.should.have.been.calledWith(extraDefinition);

            extraHandler.beforeServiceInitialised.should.have.been.calledWith(
                extraDefinition,
                sinon.match.instanceOf(ExtensionApi)
            );

            initialiser.initialise.should.not.have.been.called;

        });

    });

    it('rejects when beforeServiceInitialised is rejected in a handler', function () {

        var extraHandler = containerDoubles.extraHandler(),
            container;

        extraHandler.canHandleExtra.returns(true);
        extraHandler.beforeServiceInitialised.rejects();

        container = new Container(
            [ moduleLoader, initialiser, extraHandler ],
            {
                services: {
                    exampleService: {
                        extras: ['extra']
                    }
                }
            }
        );

        return container.get('exampleService').should.eventually.be.rejected;

    });

    it('notifies extra when a service is initialised', function () {

        var extraHandler = containerDoubles.extraHandler();
        var extraDefinition = {};

        var container = new Container(
            [ moduleLoader, initialiser, extraHandler ],
            {
                services: {
                    exampleService: {
                        extras: [
                            extraDefinition
                        ]
                    }
                }
            }
        );

        var instance = {};

        extraHandler.canHandleExtra.returns(true);
        initialiser.initialise.returns(instance);

        return container.get('exampleService').then(function () {
            extraHandler.canHandleExtra.should.have.been.calledWith(extraDefinition);
            extraHandler.onServiceInitialised.should.have.been.calledWith(
                instance,
                extraDefinition,
                sinon.match.instanceOf(ExtensionApi)
            );
        });

    });

    it('rejects when onServiceInitialised is rejected in a handler', function () {

        var extraHandler = containerDoubles.extraHandler(),
            instance = {},
            container;

        extraHandler.canHandleExtra.returns(true);
        extraHandler.onServiceInitialised.rejects();
        initialiser.initialise.returns(instance);

        container = new Container(
            [ moduleLoader, initialiser, extraHandler ],
            {
                services: {
                    exampleService: {
                        extras: ['extra']
                    }
                }
            }
        );

        return container.get('exampleService').should.eventually.be.rejected;

    });

    it('notifies extra handlers when the promise has been made', function () {

        var serviceDefinition;
        var extraHandler = containerDoubles.extraHandler();

        var container = new Container(
            [ moduleLoader, initialiser, extraHandler ],
            {
                services: {
                    exampleService: serviceDefinition = {
                        extras: ['extra']
                    }
                }
            }
        );

        extraHandler.canHandleExtra.returns(true);

        container.get('exampleService');

        extraHandler.onGetComplete.should.have.been.calledWith(
            'extra',
            sinon.match.instanceOf(ExtensionApi)
        );

    });

    it('only requires canHandleExtra method on extra handlers', function(done) {

        var extraDefinition = {};

        var container = new Container(
            [
                moduleLoader,
                initialiser,
                { canHandleExtra: function () { return true; } }
            ],
            {
                services: {
                    exampleService: {
                        extras: [ "extra" ]
                    }
                }
            }
        );

        var instance = {};
        initialiser.initialise.returns({});

        container.get('exampleService').then(function () {
            done();
        });

    });

    it('ignores extras which cannot handle a definition', function () {

        var extraHandler = containerDoubles.extraHandler();
        var uselessExtraHandler = containerDoubles.extraHandler();
        var extraDefinition = {};

        var container = new Container(
            [ moduleLoader, initialiser, uselessExtraHandler, extraHandler ],
            {
                services: {
                    exampleService: {
                        extras: [
                            extraDefinition
                        ]
                    }
                }
            }
        );

        var instance = {};

        extraHandler.canHandleExtra.returns(true);
        uselessExtraHandler.canHandleExtra.returns(false);

        initialiser.initialise.returns(instance);

        return container.get('exampleService').then(function () {
            extraHandler.beforeServiceInitialised.should.have.been.called;
            uselessExtraHandler.beforeServiceInitialised.should.not.have.been.called;
        });

    });

    it('rejects the promise when no handler for an extra is available', function () {

        var container = new Container(
            [ moduleLoader, initialiser ],
            {
                services: {
                    exampleService: {
                        extras: [ {} ]
                    }
                }
            }
        );

        return container.get('exampleService').should.eventually.be.rejected;

    });

    it('appends offending service id to any errors thrown by extensions', function(done) {

        var initialiserError = new Error('foo');
        var brokenInitialiser = containerDoubles.initialiser();
        brokenInitialiser.canInitialise.throws(initialiserError);

        var container = new Container(
            [ moduleLoader, argResolver, brokenInitialiser ],
            definition
        );

        container.get('exampleService').catch(function(error) {
            error.message.should.contain('exampleService');
            error.stack.should.equal(initialiserError.stack);
            done();
        });

    });

    it('initialises extension api with info about the current get call', function () {

        var container = new Container(
            [
                moduleLoader,
                argResolver,
                initialiser
            ],
            {
                services: {
                    exampleService: 'exampleDefinition'
                }
            }
        );

        argResolver.resolveArg.withArgs('foo').resolves('bar');

        return container.get('exampleService').then(function () {

            var extensionApi = moduleLoader.loadModule.args[0][0];

            extensionApi.serviceId.should.equal('exampleService');
            extensionApi.serviceDefinition.should.equal('exampleDefinition');
            extensionApi.unsafeContainer.should.equal(container);

        });

    });

    it('initialises extension api with resolveArgs function', function () {

        var container = new Container(
            [
                moduleLoader,
                argResolver,
                initialiser
            ],
            {
                services: {
                    exampleService: {}
                }
            }
        );

        argResolver.resolveArg.withArgs('foo').resolves('bar');

        return container.get('exampleService').then(function () {

            var extensionApi = moduleLoader.loadModule.args[0][0];

            return Promise.all(extensionApi.resolveArgs(['foo']));

        }).then(function(resolvedArgs) {

            resolvedArgs.should.deep.equal(['bar']);
        });

    });

});
