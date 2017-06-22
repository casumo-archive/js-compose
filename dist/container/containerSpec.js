define(['../globals', 'sinon', '../../test/doubles', './Container', './ExtensionApi'], function (_globals, _sinon, _doubles, _Container, _ExtensionApi) {
    'use strict';

    var sinon = _interopRequireWildcard(_sinon);

    var _Container2 = _interopRequireDefault(_Container);

    var _ExtensionApi2 = _interopRequireDefault(_ExtensionApi);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _interopRequireWildcard(obj) {
        if (obj && obj.__esModule) {
            return obj;
        } else {
            var newObj = {};

            if (obj != null) {
                for (var key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
                }
            }

            newObj.default = obj;
            return newObj;
        }
    }

    /* eslint no-unused-expressions: 0 */
    /* eslint-env mocha */

    let definition;
    let moduleLoader;
    let argResolver;
    let initialiser;
    let extensionApi;

    // eslint-disable-next-line max-statements
    describe('Container', () => {

        beforeEach(() => {

            definition = {
                services: {
                    exampleService: {}
                }
            };

            moduleLoader = _doubles.containerDoubles.moduleLoader();
            moduleLoader.canLoadModule.returns(true);
            moduleLoader.loadModule.resolves(Object);

            argResolver = _doubles.containerDoubles.argResolver();
            argResolver.canResolveArg.returns(true);
            argResolver.resolveArg.resolves(Object);

            initialiser = _doubles.containerDoubles.initialiser();
            initialiser.canInitialise.returns(true);

            extensionApi = _doubles.containerDoubles.extensionApi();
        });

        describe('defaultInitialiser', () => {

            it('makes the provided initialiser the default', () => {

                initialiser.canInitialise.returns(false);

                extensionApi.serviceDefinition = {};

                (0, _Container.defaultInitialiser)(initialiser).canInitialise(extensionApi).should.equal(true);
            });

            it('does not default if the init property is set', () => {

                const returned = {};

                initialiser.canInitialise.returns(returned);

                extensionApi.serviceDefinition = { init: 'example' };

                (0, _Container.defaultInitialiser)(initialiser).canInitialise(extensionApi).should.equal(returned);
            });
        });

        it('uses provided module loaders', () => {

            const container = new _Container2.default([moduleLoader, initialiser], definition);

            container.get('exampleService');

            moduleLoader.canLoadModule.should.have.been.calledWith(sinon.match.instanceOf(_ExtensionApi2.default));

            moduleLoader.loadModule.should.have.been.calledWith(sinon.match.instanceOf(_ExtensionApi2.default));
        });

        it('skips module loaders which can not load the service', () => {

            const uselessModuleLoader = _doubles.containerDoubles.moduleLoader();

            uselessModuleLoader.canLoadModule.returns(false);

            const container = new _Container2.default([uselessModuleLoader, moduleLoader, initialiser], definition);

            container.get('exampleService');

            uselessModuleLoader.loadModule.should.not.have.been.called;
            moduleLoader.loadModule.should.have.been.called;
        });

        it('rejects the promise if no valid module loader is available', () => {

            const container = new _Container2.default([initialiser], definition);

            const result = container.get('exampleService');

            return result.should.eventually.be.rejected;
        });

        it('rejects the promise if no matching definition is found', () => {

            const container = new _Container2.default([moduleLoader, initialiser], {
                services: {}
            });

            const result = container.get('exampleService');

            return result.should.eventually.be.rejected;
        });

        it('only initialises one instance of a service', () => {

            const container = new _Container2.default([moduleLoader, initialiser], definition);

            initialiser.initialise.returns({});

            return _globals.Promise.all([container.get('exampleService'), container.get('exampleService')]).then(_globals._.spread((first, second) => {
                first.should.equal(second);
                initialiser.initialise.should.have.been.calledOnce;
            }));
        });

        it('uses provided arg resolvers', done => {

            const container = new _Container2.default([moduleLoader, argResolver, initialiser], {
                services: {
                    exampleService: {
                        args: ['foo', 'bar']
                    }
                }
            });

            function exampleModule() {}

            moduleLoader.loadModule.resolves(exampleModule);

            argResolver.resolveArg.withArgs('foo').resolves(123);
            argResolver.resolveArg.withArgs('bar').resolves(456);

            container.get('exampleService').then(() => {

                initialiser.initialise.should.have.been.calledWith(sinon.match.func, exampleModule, 123, 456);
                done();
            });
        });

        it('skips arg resolvers which cannot resolve the arg', () => {

            const uselessArgResolver = _doubles.containerDoubles.argResolver();

            const container = new _Container2.default([moduleLoader, uselessArgResolver, argResolver, initialiser], {
                services: {
                    exampleService: {
                        args: ['foo']
                    }
                }
            });

            uselessArgResolver.canResolveArg.returns(false);

            container.get('exampleService');

            uselessArgResolver.resolveArg.should.not.have.been.called;
            argResolver.resolveArg.should.have.been.called;
        });

        it('rejects the promise if no valid arg resolver is available', () => {

            const container = new _Container2.default([moduleLoader, argResolver, initialiser], {
                services: {
                    exampleService: {
                        args: ['foo']
                    }
                }
            });

            argResolver.canResolveArg.returns(false);

            return container.get('exampleService').should.eventually.be.rejected;
        });

        it('passes extension api to the arg resolvers', done => {

            const container = new _Container2.default([moduleLoader, argResolver, initialiser], {
                services: {
                    exampleService: {
                        args: ['foo']
                    }
                }
            });

            container.get('exampleService').then(() => {
                argResolver.resolveArg.should.have.been.calledWith('foo', sinon.match.instanceOf(_ExtensionApi2.default));
                done();
            });
        });

        it('adds argDefinition to rejected arg messages', done => {

            const container = new _Container2.default([moduleLoader, {
                canResolveArg() {
                    return true;
                },
                resolveArg() {
                    return _globals.Promise.reject(new Error('foobar'));
                }
            }, initialiser], {
                services: {
                    exampleService: { args: ['meow'] }
                }
            });

            container.get('exampleService').catch(error => {
                error.message.should.contain('foobar');
                error.message.should.contain('meow');
                done();
            });
        });

        it('uses provided initialisers', done => {

            const exampleInstance = {};

            const container = new _Container2.default([moduleLoader, argResolver, initialiser], {
                services: {
                    exampleService: {
                        args: ['foo']
                    }
                }
            });

            function exampleModule() {}

            moduleLoader.loadModule.returns(exampleModule);
            argResolver.resolveArg.resolves(123);
            initialiser.initialise.returns(exampleInstance);

            container.get('exampleService').then(result => {
                result.should.equal(exampleInstance);
                initialiser.initialise.should.have.been.calledWith(sinon.match.func, exampleModule, 123);
                done();
            });
        });

        // eslint-disable-next-line max-len
        it('passes a callback to initialisers which notifies extras when an instance of a service is created', () => {

            const extraHandler = _doubles.containerDoubles.extraHandler();
            const extraDefinition = {};

            const exampleInstance = {};

            const container = new _Container2.default([moduleLoader, initialiser, extraHandler], {
                services: {
                    exampleService: {
                        extras: [extraDefinition]
                    }
                }
            });

            function exampleModule() {}

            moduleLoader.loadModule.returns(exampleModule);

            initialiser.initialise.callsArgWith(0, exampleInstance);

            extraHandler.canHandleExtra.returns(true);

            container.get('exampleService');

            return extraHandler.onServiceInstanceCreated.should.eventuallyBeCalled().then(_globals._.spread(() => {

                extraHandler.onServiceInstanceCreated.should.have.been.calledWith(exampleInstance, extraDefinition, sinon.match.instanceOf(_ExtensionApi2.default));
            }));
        });

        // eslint-disable-next-line max-len
        it('should call onServiceInstanceCreated synchronously when initialiser calls instanceCreatedCallback', () => {

            const extraHandler = _doubles.containerDoubles.extraHandler();
            const exampleInstance = {};

            const container = new _Container2.default([moduleLoader, initialiser, extraHandler], {
                services: {
                    exampleService: {
                        extras: [{}]
                    }
                }
            });

            moduleLoader.loadModule.returns(() => {});

            extraHandler.canHandleExtra.returns(true);

            return container.get('exampleService').then(() => {

                initialiser.initialise.args[0][0](exampleInstance);

                extraHandler.onServiceInstanceCreated.should.have.been.calledWith(exampleInstance);
            });
        });

        it('skips initialisers which cannot load the service', () => {

            const uselessInitialiser = _doubles.containerDoubles.initialiser();

            uselessInitialiser.canInitialise.returns(false);

            const container = new _Container2.default([moduleLoader, argResolver, uselessInitialiser, initialiser], definition);

            return container.get('exampleService').then(() => {
                uselessInitialiser.initialise.should.not.have.been.called;
                initialiser.initialise.should.have.been.called;
            });
        });

        it('rejects the promise when no initialiser is available', () => {

            const uselessInitialiser = _doubles.containerDoubles.initialiser();

            uselessInitialiser.canInitialise.returns(false);

            const container = new _Container2.default([moduleLoader, argResolver, uselessInitialiser], definition);

            return container.get('exampleService').should.eventually.be.rejected;
        });

        it('notifies extra before a service is initialised', () => {

            const extraHandler = _doubles.containerDoubles.extraHandler();
            const extraDefinition = {};

            const container = new _Container2.default([moduleLoader, initialiser, extraHandler], {
                services: {
                    exampleService: {
                        extras: [extraDefinition]
                    }
                }
            });

            extraHandler.canHandleExtra.returns(true);
            extraHandler.beforeServiceInitialised.promises();

            container.get('exampleService');

            return extraHandler.beforeServiceInitialised.should.eventuallyBeCalled().then(() => {

                extraHandler.canHandleExtra.should.have.been.calledWith(extraDefinition);

                extraHandler.beforeServiceInitialised.should.have.been.calledWith(extraDefinition, sinon.match.instanceOf(_ExtensionApi2.default));

                initialiser.initialise.should.not.have.been.called;
            });
        });

        it('rejects when beforeServiceInitialised is rejected in a handler', () => {

            const extraHandler = _doubles.containerDoubles.extraHandler();

            extraHandler.canHandleExtra.returns(true);
            extraHandler.beforeServiceInitialised.rejects();

            const container = new _Container2.default([moduleLoader, initialiser, extraHandler], {
                services: {
                    exampleService: {
                        extras: ['extra']
                    }
                }
            });

            return container.get('exampleService').should.eventually.be.rejected;
        });

        it('notifies extra when a service is initialised', () => {

            const extraHandler = _doubles.containerDoubles.extraHandler();
            const extraDefinition = {};

            const container = new _Container2.default([moduleLoader, initialiser, extraHandler], {
                services: {
                    exampleService: {
                        extras: [extraDefinition]
                    }
                }
            });

            const instance = {};

            extraHandler.canHandleExtra.returns(true);
            initialiser.initialise.returns(instance);

            return container.get('exampleService').then(() => {
                extraHandler.canHandleExtra.should.have.been.calledWith(extraDefinition);
                extraHandler.onServiceInitialised.should.have.been.calledWith(instance, extraDefinition, sinon.match.instanceOf(_ExtensionApi2.default));
            });
        });

        it('rejects when onServiceInitialised is rejected in a handler', () => {

            const extraHandler = _doubles.containerDoubles.extraHandler();
            const instance = {};

            extraHandler.canHandleExtra.returns(true);
            extraHandler.onServiceInitialised.rejects();
            initialiser.initialise.returns(instance);

            const container = new _Container2.default([moduleLoader, initialiser, extraHandler], {
                services: {
                    exampleService: {
                        extras: ['extra']
                    }
                }
            });

            return container.get('exampleService').should.eventually.be.rejected;
        });

        it('notifies extra handlers when the promise has been made', () => {

            const extraHandler = _doubles.containerDoubles.extraHandler();

            const container = new _Container2.default([moduleLoader, initialiser, extraHandler], {
                services: {
                    exampleService: {
                        extras: ['extra']
                    }
                }
            });

            extraHandler.canHandleExtra.returns(true);

            container.get('exampleService');

            extraHandler.onGetComplete.should.have.been.calledWith('extra', sinon.match.instanceOf(_ExtensionApi2.default));
        });

        it('only requires canHandleExtra method on extra handlers', done => {

            const container = new _Container2.default([moduleLoader, initialiser, {
                canHandleExtra() {
                    return true;
                }
            }], {
                services: {
                    exampleService: {
                        extras: ['extra']
                    }
                }
            });

            initialiser.initialise.returns({});

            container.get('exampleService').then(() => {
                done();
            });
        });

        it('ignores extras which cannot handle a definition', () => {

            const extraHandler = _doubles.containerDoubles.extraHandler();
            const uselessExtraHandler = _doubles.containerDoubles.extraHandler();
            const extraDefinition = {};

            const container = new _Container2.default([moduleLoader, initialiser, uselessExtraHandler, extraHandler], {
                services: {
                    exampleService: {
                        extras: [extraDefinition]
                    }
                }
            });

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

            const container = new _Container2.default([moduleLoader, initialiser], {
                services: {
                    exampleService: {
                        extras: [{}]
                    }
                }
            });

            return container.get('exampleService').should.eventually.be.rejected;
        });

        it('appends offending service id to any errors thrown by extensions', done => {

            const initialiserError = new Error('foo');
            const brokenInitialiser = _doubles.containerDoubles.initialiser();

            brokenInitialiser.canInitialise.throws(initialiserError);

            const container = new _Container2.default([moduleLoader, argResolver, brokenInitialiser], definition);

            container.get('exampleService').catch(error => {
                error.message.should.contain('exampleService');
                error.stack.should.equal(initialiserError.stack);
                done();
            });
        });

        it('initialises extension api with info about the current get call', () => {

            const container = new _Container2.default([moduleLoader, argResolver, initialiser], {
                services: {
                    exampleService: 'exampleDefinition'
                }
            });

            argResolver.resolveArg.withArgs('foo').resolves('bar');

            return container.get('exampleService').then(() => {

                const [[extensionApi]] = moduleLoader.loadModule.args;

                extensionApi.serviceId.should.equal('exampleService');
                extensionApi.serviceDefinition.should.equal('exampleDefinition');
                extensionApi.unsafeContainer.should.equal(container);
            });
        });

        it('initialises extension api with resolveArgs function', () => {

            const container = new _Container2.default([moduleLoader, argResolver, initialiser], {
                services: {
                    exampleService: {}
                }
            });

            argResolver.resolveArg.withArgs('foo').resolves('bar');

            return container.get('exampleService').then(() => {

                const [[extensionApi]] = moduleLoader.loadModule.args;

                return _globals.Promise.all(extensionApi.resolveArgs(['foo']));
            }).then(resolvedArgs => {

                resolvedArgs.should.deep.equal(['bar']);
            });
        });
    });
});