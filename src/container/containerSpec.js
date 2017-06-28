/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import { _, Promise } from '../globals';
import * as sinon from 'sinon';
import { containerDoubles } from '../../test/doubles';
import Container from './Container';
import { defaultInitialiser } from './Container';
import ExtensionApi from './ExtensionApi';

let definition;
let moduleLoader;
let argResolver;
let initialiser;
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

            return result.should.eventually.be.rejected;

        });

        it('rejects the promise if no matching definition is found', () => {

            const container = new Container(
                [moduleLoader, initialiser],
                {
                    services: {}
                }
            );

            const result = container.get('exampleService');

            return result.should.eventually.be.rejected;

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

            uselessArgResolver.resolveArg.should.not.have.been.called;
            argResolver.resolveArg.should.have.been.called;

        });

        it('rejects the promise if no valid arg resolver is available', () => {

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

            return container.get('exampleService').should.eventually.be.rejected;

        });

        it('passes extension api to the arg resolvers', (done) => {

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

            // eslint-disable-next-line max-nested-callbacks
            container.get('exampleService').then(() => {
                argResolver.resolveArg.should.have.been.calledWith(
                    'foo',
                    sinon.match.instanceOf(ExtensionApi)
                );
                done();
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

            const extraHandler = containerDoubles.extraHandler();
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

            extraHandler.canHandleExtra.returns(true);

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

            const extraHandler = containerDoubles.extraHandler();
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

            extraHandler.canHandleExtra.returns(true);

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

            return container.get('exampleService').should.eventually.be.rejected;

        });

        it('notifies extra before a service is initialised', () => {

            const extraHandler = containerDoubles.extraHandler();
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

            extraHandler.canHandleExtra.returns(true);
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

            const extraHandler = containerDoubles.extraHandler();

            extraHandler.canHandleExtra.returns(true);
            extraHandler.beforeServiceInitialised.rejects();

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

            return container.get('exampleService').should.eventually.be.rejected;

        });

        it('notifies extra when a service is initialised', () => {

            const extraHandler = containerDoubles.extraHandler();
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

            extraHandler.canHandleExtra.returns(true);
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

            const extraHandler = containerDoubles.extraHandler();
            const instance = {};

            extraHandler.canHandleExtra.returns(true);
            extraHandler.onServiceInitialised.rejects();
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

            return container.get('exampleService').should.eventually.be.rejected;

        });

        it('notifies extra handlers when the promise has been made', () => {

            const extraHandler = containerDoubles.extraHandler();

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

            extraHandler.canHandleExtra.returns(true);

            container.get('exampleService');

            extraHandler.onGetComplete.should.have.been.calledWith(
                'extra',
                sinon.match.instanceOf(ExtensionApi)
            );

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

            const extraHandler = containerDoubles.extraHandler();
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

            extraHandler.canHandleExtra.returns(true);
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

            return container.get('exampleService').should.eventually.be.rejected;

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

        it('should resolve with an empty array for a valid container', () => {

            const container = new Container([], { services: {} });

            return container.lint().should.eventually.deep.equal([]);

        });

        it('should resolve with errors for services with missing module loaders', () => {

            const container = new Container([], definition);

            return container.lint().then((errors) => {
                errors.length.should.equal(1);
                errors[0].should.contain('exampleService');
            });

        });

    });

});
