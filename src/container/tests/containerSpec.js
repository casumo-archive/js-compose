/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import sinon from 'sinon';
import { _, Promise } from '../../globals';
import { containerDoubles } from '../../../test/doubles';
import Container, { defaultInitialiser } from '../Container';
import ExtensionApi from '../ExtensionApi';
import { ServiceError } from '../errors';

let definition;
let moduleLoader;
let argResolver;
let initialiser;
let extraHandler;
let extensionApi;

describe('Container', () => {

    beforeEach(() => {

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

        extraHandler = containerDoubles.extraHandler();
        extraHandler.canHandleExtra.returns(true);

        extensionApi = containerDoubles.extensionApi();

    });

    describe('defaultInitialiser', () => {

        it('makes the provided initialiser the default', () => {

            initialiser.canInitialise.returns(false);

            extensionApi.serviceDefinition = {};

            defaultInitialiser(initialiser).canInitialise(extensionApi).should.equal(true);

        });

        it('does not default if the init property is set', () => {

            const returned = {};

            initialiser.canInitialise.returns(returned);

            extensionApi.serviceDefinition = { init: 'example' };

            defaultInitialiser(initialiser).canInitialise(extensionApi).should.equal(returned);

        });

    });

    // eslint-disable-next-line max-statements
    describe('get', () => {

        it('uses provided module loaders', () => {

            const container = new Container(
                [moduleLoader, initialiser],
                definition
            );

            container.get('exampleService');

            moduleLoader.canLoadModule.should.have.been.calledWith(sinon.match.instanceOf(ExtensionApi));

            moduleLoader.loadModule.should.have.been.calledWith(sinon.match.instanceOf(ExtensionApi));

        });

        it('skips module loaders which can not load the service', () => {

            const uselessModuleLoader = containerDoubles.moduleLoader();

            uselessModuleLoader.canLoadModule.returns(false);

            const container = new Container(
                [uselessModuleLoader, moduleLoader, initialiser],
                definition
            );

            container.get('exampleService');

            uselessModuleLoader.loadModule.should.not.have.been.called;
            moduleLoader.loadModule.should.have.been.called;

        });

        it('rejects the promise if no valid module loader is available', () => {

            const container = new Container(
                [initialiser],
                definition
            );

            const result = container.get('exampleService');

            return result.should.eventually.be.rejectedWith(ServiceError);

        });

        it('rejects the promise if no matching definition is found', () => {

            const container = new Container(
                [moduleLoader, initialiser],
                {
                    services: {}
                }
            );

            const result = container.get('exampleService');

            return result.should.eventually.be.rejectedWith(ServiceError);

        });

        it('only initialises one instance of a service', () => {

            const container = new Container(
                [moduleLoader, initialiser],
                definition
            );

            initialiser.initialise.returns({});

            return Promise.all([
                container.get('exampleService'),
                container.get('exampleService')

            // eslint-disable-next-line max-nested-callbacks
            ]).then(_.spread((first, second) => {
                first.should.equal(second);
                initialiser.initialise.should.have.been.calledOnce;
            }));

        });

        it('uses provided arg resolvers', (done) => {

            const container = new Container(
                [moduleLoader, argResolver, initialiser],
                {
                    services: {
                        exampleService: {
                            args: ['foo', 'bar']
                        }
                    }
                }
            );

            function exampleModule () {}

            moduleLoader.loadModule.resolves(exampleModule);

            argResolver.resolveArg.withArgs('foo').resolves(123);
            argResolver.resolveArg.withArgs('bar').resolves(456);

            // eslint-disable-next-line max-nested-callbacks
            container.get('exampleService').then(() => {

                initialiser.initialise.should.have.been.calledWith(sinon.match.func, exampleModule, 123, 456);
                done();

            });

        });

        it('skips arg resolvers which cannot resolve the arg', () => {

            const uselessArgResolver = containerDoubles.argResolver();

            const container = new Container(
                [moduleLoader, uselessArgResolver, argResolver, initialiser],
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

            // eslint-disable-next-line max-nested-callbacks
            return argResolver.resolveArg.should.eventuallyBeCalled().then(() => {
                uselessArgResolver.resolveArg.should.not.have.been.called;
            });

        });

        it('returns promise rejected with ServiceError if no valid arg resolver is available', () => {

            const container = new Container(
                [moduleLoader, argResolver, initialiser],
                {
                    services: {
                        exampleService: {
                            args: ['foo']
                        }
                    }
                }
            );

            argResolver.canResolveArg.returns(false);

            return container.get('exampleService').should.eventually.be.rejectedWith(ServiceError);

        });

        it('passes extension api to the arg resolvers', () => {

            const container = new Container(
                [moduleLoader, argResolver, initialiser],
                {
                    services: {
                        exampleService: {
                            args: ['foo']
                        }
                    }
                }
            );

            container.get('exampleService');

            // eslint-disable-next-line max-nested-callbacks, max-len
            return argResolver.resolveArg.should.eventuallyBeCalled().then(([argDefinition, extensionApi]) => {
                argDefinition.should.equal('foo');
                extensionApi.should.be.instanceOf(ExtensionApi);
            });

        });

        it('adds argDefinition to rejected arg messages', (done) => {

            const container = new Container(
                [
                    moduleLoader,
                    {
                        canResolveArg () {
                            return true;
                        },
                        resolveArg () {
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

            container.get('exampleService').catch((error) => {
                error.message.should.contain('foobar');
                error.message.should.contain('meow');
                done();
            });

        });

        it('uses provided initialisers', (done) => {

            const exampleInstance = {};

            const container = new Container(
                [moduleLoader, argResolver, initialiser],
                {
                    services: {
                        exampleService: {
                            args: ['foo']
                        }
                    }
                }
            );

            function exampleModule () {}

            moduleLoader.loadModule.returns(exampleModule);
            argResolver.resolveArg.resolves(123);
            initialiser.initialise.returns(exampleInstance);

            container.get('exampleService').then((result) => {
                result.should.equal(exampleInstance);
                initialiser.initialise.should.have.been.calledWith(sinon.match.func, exampleModule, 123);
                done();
            });

        });

        // eslint-disable-next-line max-len
        it('passes a callback to initialisers which notifies extras when an instance of a service is created', () => {

            const extraDefinition = {};

            const exampleInstance = {};

            const container = new Container(
                [moduleLoader, initialiser, extraHandler],
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

            function exampleModule () {}

            moduleLoader.loadModule.returns(exampleModule);

            initialiser.initialise.callsArgWith(0, exampleInstance);

            container.get('exampleService');

            return extraHandler.onServiceInstanceCreated.should.eventuallyBeCalled().then(_.spread(() => {

                extraHandler.onServiceInstanceCreated.should.have.been.calledWith(
                    exampleInstance,
                    extraDefinition,
                    sinon.match.instanceOf(ExtensionApi)
                );

            }));

        });

        // eslint-disable-next-line max-len
        it('should call onServiceInstanceCreated synchronously when initialiser calls instanceCreatedCallback', () => {

            const exampleInstance = {};

            const container = new Container(
                [moduleLoader, initialiser, extraHandler],
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

            moduleLoader.loadModule.returns(() => {});

            return container.get('exampleService').then(() => {

                initialiser.initialise.args[0][0](exampleInstance);

                extraHandler.onServiceInstanceCreated.should.have.been.calledWith(exampleInstance);

            });

        });

        it('skips initialisers which cannot load the service', () => {

            const uselessInitialiser = containerDoubles.initialiser();

            uselessInitialiser.canInitialise.returns(false);

            const container = new Container(
                [moduleLoader, argResolver, uselessInitialiser, initialiser],
                definition
            );

            return container.get('exampleService').then(() => {
                uselessInitialiser.initialise.should.not.have.been.called;
                initialiser.initialise.should.have.been.called;
            });

        });

        it('rejects the promise when no initialiser is available', () => {

            const uselessInitialiser = containerDoubles.initialiser();

            uselessInitialiser.canInitialise.returns(false);

            const container = new Container(
                [moduleLoader, argResolver, uselessInitialiser],
                definition
            );

            return container.get('exampleService').should.eventually.be.rejectedWith(ServiceError);

        });

        it('notifies extra before a service is initialised', () => {

            const extraDefinition = {};

            const container = new Container(
                [moduleLoader, initialiser, extraHandler],
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

            extraHandler.beforeServiceInitialised.promises();

            container.get('exampleService');

            return extraHandler.beforeServiceInitialised.should.eventuallyBeCalled().then(() => {

                extraHandler.canHandleExtra.should.have.been.calledWith(extraDefinition);

                extraHandler.beforeServiceInitialised.should.have.been.calledWith(
                    extraDefinition,
                    sinon.match.instanceOf(ExtensionApi)
                );

                initialiser.initialise.should.not.have.been.called;

            });

        });

        it('rejects when beforeServiceInitialised is rejected in a handler', () => {

            extraHandler.beforeServiceInitialised.rejects(new Error());

            const container = new Container(
                [moduleLoader, initialiser, extraHandler],
                {
                    services: {
                        exampleService: {
                            extras: ['extra']
                        }
                    }
                }
            );

            return container.get('exampleService').should.eventually.be.rejectedWith(ServiceError);

        });

        it('notifies extra when a service is initialised', () => {

            const extraDefinition = {};

            const container = new Container(
                [moduleLoader, initialiser, extraHandler],
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

            const instance = {};

            initialiser.initialise.returns(instance);

            return container.get('exampleService').then(() => {
                extraHandler.canHandleExtra.should.have.been.calledWith(extraDefinition);
                extraHandler.onServiceInitialised.should.have.been.calledWith(
                    instance,
                    extraDefinition,
                    sinon.match.instanceOf(ExtensionApi)
                );
            });

        });

        it('rejects when onServiceInitialised is rejected in a handler', () => {

            const instance = {};

            extraHandler.onServiceInitialised.rejects(new Error());
            initialiser.initialise.returns(instance);

            const container = new Container(
                [moduleLoader, initialiser, extraHandler],
                {
                    services: {
                        exampleService: {
                            extras: ['extra']
                        }
                    }
                }
            );

            return container.get('exampleService').should.eventually.be.rejectedWith(ServiceError);

        });

        it('notifies extra handlers when the promise has been made', () => {

            const container = new Container(
                [moduleLoader, initialiser, extraHandler],
                {
                    services: {
                        exampleService: {
                            extras: ['extra']
                        }
                    }
                }
            );

            return container.get('exampleService').then(() => {
                extraHandler.onGetComplete.should.have.been.calledWith(
                    'extra',
                    sinon.match.instanceOf(ExtensionApi)
                );
            });
        });

        it('only requires canHandleExtra method on extra handlers', (done) => {

            const container = new Container(
                [
                    moduleLoader,
                    initialiser,
                    {
                        canHandleExtra () {
                            return true;
                        }
                    }
                ],
                {
                    services: {
                        exampleService: {
                            extras: ['extra']
                        }
                    }
                }
            );

            initialiser.initialise.returns({});

            container.get('exampleService').then(() => {
                done();
            });

        });

        it('ignores extras which cannot handle a definition', () => {

            const uselessExtraHandler = containerDoubles.extraHandler();
            const extraDefinition = {};

            const container = new Container(
                [moduleLoader, initialiser, uselessExtraHandler, extraHandler],
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

            const instance = {};

            uselessExtraHandler.canHandleExtra.returns(false);

            initialiser.initialise.returns(instance);

            return container.get('exampleService').then(() => {
                extraHandler.beforeServiceInitialised.should.have.been.called;
                uselessExtraHandler.beforeServiceInitialised.should.not.have.been.called;
            });

        });

        it('rejects the promise when no handler for an extra is available', () => {

            const container = new Container(
                [moduleLoader, initialiser],
                {
                    services: {
                        exampleService: {
                            extras: [{}]
                        }
                    }
                }
            );

            return container.get('exampleService').should.eventually.be.rejectedWith(ServiceError);

        });

        it('appends offending service id to any errors thrown by extensions', (done) => {

            const initialiserError = new Error('foo');
            const brokenInitialiser = containerDoubles.initialiser();

            brokenInitialiser.canInitialise.throws(initialiserError);

            const container = new Container(
                [moduleLoader, argResolver, brokenInitialiser],
                definition
            );

            container.get('exampleService').catch((error) => {
                error.message.should.contain('exampleService');
                error.stack.should.equal(initialiserError.stack);
                done();
            });

        });

        it('initialises extension api with info about the current get call', () => {

            const container = new Container(
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

            return container.get('exampleService').then(() => {

                const [[extensionApi]] = moduleLoader.loadModule.args;

                extensionApi.serviceId.should.equal('exampleService');
                extensionApi.serviceDefinition.should.equal('exampleDefinition');
                extensionApi.unsafeContainer.should.equal(container);

            });

        });

        it('initialises extension api with resolveArgs function', () => {

            const container = new Container(
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

            return container.get('exampleService').then(() => {

                const [[extensionApi]] = moduleLoader.loadModule.args;

                return Promise.all(extensionApi.resolveArgs(['foo']));

            }).then((resolvedArgs) => {

                resolvedArgs.should.deep.equal(['bar']);
            });

        });

    });

    describe('lint', () => {

        function extensionApiForService (serviceId) {
            return sinon.match((extensionApi) => {
                return extensionApi.serviceId === serviceId;
            });
        }

        beforeEach(() => {

            definition = {
                services: {
                    validService: {},
                    invalidService: {}
                }
            };

        });

        it('should resolve with an empty array for a valid container', () => {

            const container = new Container([], { services: {} });

            return container.lint().should.eventually.deep.equal([]);

        });

        it('should resolve with errors for services with missing module loaders', () => {

            const container = new Container([moduleLoader, initialiser], definition);

            moduleLoader.canLoadModule
                .withArgs(sinon.match(extensionApiForService('invalidService')))
                .returns(false);

            return container.lint().then((errors) => {
                errors.length.should.equal(1);
                errors[0].should.contain('invalidService');
            });

        });

        it('should resolve with errors for services with missing arg resolvers', () => {

            const container = new Container([moduleLoader, argResolver, initialiser], definition);

            definition.services.invalidService.args = ['validArg', 'invalidArg'];

            argResolver.canResolveArg.withArgs('validArg').returns(true);
            argResolver.canResolveArg.withArgs('invalidArg').returns(false);

            return container.lint().then((errors) => {
                errors.length.should.equal(1);
                errors[0].should.contain('invalidService');
                errors[0].should.contain('[1]');
            });

        });

        it('should resolve with errors for services with missing initialisers', () => {

            const container = new Container([moduleLoader, initialiser], definition);

            initialiser.canInitialise
                .withArgs(sinon.match(extensionApiForService('invalidService')))
                .returns(false);

            return container.lint().then((errors) => {
                errors.length.should.equal(1);
                errors[0].should.contain('invalidService');
            });

        });

        it('should resolve with errors for services with missing extra handlers', () => {

            const container = new Container([moduleLoader, initialiser, extraHandler], definition);

            definition.services.invalidService.extras = ['validExtra', 'invalidExtra'];

            extraHandler.canHandleExtra.withArgs('invalidExtra').returns(false);

            return container.lint().then((errors) => {
                errors.length.should.equal(1);
                errors[0].should.contain('invalidService');
                errors[0].should.contain('[1]');
            });

        });

        it('should resolve with errors returned from module loader lintLoader', () => {

            const container = new Container([moduleLoader, initialiser], definition);

            moduleLoader.lintLoader
                .withArgs(sinon.match(extensionApiForService('invalidService')))
                .resolves(['Example error']);

            return container.lint().then((errors) => {
                errors.length.should.equal(1);
                errors[0].should.equal('Example error');
            });

        });

        it('should not require module loaders to define the lintLoader method', () => {

            const container = new Container([moduleLoader, initialiser], definition);

            delete moduleLoader.lintLoader;

            return container.lint().should.eventually.deep.equal([]);

        });

        it('should resolve with errors from arg resolver lintArg', () => {

            const container = new Container([moduleLoader, argResolver, initialiser], definition);

            definition.services.invalidService.args = ['arg'];

            argResolver.lintArg
                .withArgs('arg', sinon.match(extensionApiForService('invalidService')))
                .resolves(['Example error']);

            return container.lint().then((errors) => {
                errors.length.should.equal(1);
                errors[0].should.contain('Example error');
            });

        });

        it('should not require arg resolvers to define the lint method', () => {

            const container = new Container([moduleLoader, argResolver, initialiser], definition);

            definition.services.invalidService.args = ['arg'];

            delete argResolver.lintArg;

            return container.lint().should.eventually.deep.equal([]);

        });

        it('should resolve with errors from extra handler lintExtra', () => {

            const container = new Container([moduleLoader, initialiser, extraHandler], definition);

            definition.services.invalidService.extras = ['extra'];

            extraHandler.lintExtra
                .withArgs('extra', sinon.match(extensionApiForService('invalidService')))
                .resolves(['Example error']);

            return container.lint().then((errors) => {
                errors.length.should.equal(1);
                errors[0].should.contain('Example error');
            });

        });

        it('should not require extra handlers to define the lintExtra method', () => {

            const container = new Container([moduleLoader, initialiser, extraHandler], definition);

            definition.services.invalidService.extras = ['extra'];

            delete extraHandler.lintExtra;

            return container.lint().should.eventually.deep.equal([]);

        });

    });

});
