/* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
/* eslint-env mocha */

import * as sinon from 'sinon';
import { containerDoubles } from '../../test/doubles';
import { addSpecsForCanResolveArgMatchingPrefix } from '../../test/argResolvers';
import { addSpecsForCanHandleExtraWithProperty } from '../../test/extraHandlers';
import PubSubExtension from './PubSubExtension';

describe('PubSubExtension', () => {

    let extension;

    beforeEach(() => {
        extension = new PubSubExtension('eventBus');
    });

    addSpecsForCanResolveArgMatchingPrefix('publish:', () => extension);

    describe('resolveArg', () => {

        it('returns a function which loads services subscribing to the event then triggers the event', () => {

            const extensionApi = containerDoubles.extensionApi();
            const eventBus = sinon.stub({
                trigger () {}
            });

            extensionApi.container.get.withArgs('eventBus').resolves(eventBus);

            extensionApi.container.config.services.foo = {
                extras: [
                    {
                        subscribe: 'fooEvent'
                    }
                ]
            };

            extensionApi.container.config.services.bar = {
                extras: [
                    {
                        subscribe: {
                            fooEvent: 'handler'
                        }
                    }
                ]
            };

            return extension.resolveArg('publish:fooEvent', extensionApi).then((publishFooEvent) => {
                return publishFooEvent('foobar');
            }).then(() => {
                extensionApi.container.get.should.have.been.calledWith('foo');
                extensionApi.container.get.should.have.been.calledWith('bar');
                eventBus.trigger.should.have.been.calledWith('fooEvent', 'foobar');
            });

        });

    });

    addSpecsForCanHandleExtraWithProperty('subscribe', () => extension);

    describe('onServiceInstanceCreated', () => {

        it('should add object subscription definitions to the subscription manager', () => {

            const instance = {};
            const extensionApi = containerDoubles.extensionApi();
            const subscriptionManager = containerDoubles.subscriptionManager();
            const eventBus = sinon.stub({
                on () {}
            });
            const eventSubscription = sinon.stub({
                then () {},
                off () {}
            });
            const startCallback = sinon.spy();

            eventSubscription.then.returns(eventSubscription);

            extensionApi.resolveArg.withArgs('subscriptionManager').resolves(subscriptionManager);
            extensionApi.container.get.withArgs('eventBus').resolves(eventBus);

            eventBus.on.withArgs('fooEvent').returns(eventSubscription);

            return extension.beforeServiceInitialised(null, extensionApi).then(() => {

                extension.onServiceInstanceCreated(instance, {
                    subscribe: {
                        fooEvent: 'fooMethod'
                    }
                });

                subscriptionManager.add.should.have.been.calledWith(instance, 'fooMethod');
                subscriptionManager.add.args[0][2].start(startCallback);
                eventSubscription.then.should.have.been.calledWith(startCallback);

                subscriptionManager.add.args[0][2].stop();
                eventSubscription.off.should.have.been.called;

            });

        });

    });

    describe('onServiceInitialised', () => {

        it('should add string subscription definitions to the subscription manager', () => {

            const service = sinon.spy();
            const extensionApi = containerDoubles.extensionApi();
            const subscriptionManager = containerDoubles.subscriptionManager();
            const eventBus = sinon.stub({
                on () {}
            });
            const eventSubscription = sinon.stub({
                then () {},
                off () {}
            });
            const startCallback = sinon.spy();

            eventSubscription.then.returns(eventSubscription);

            extensionApi.resolveArg.withArgs('subscriptionManager').resolves(subscriptionManager);
            extensionApi.container.get.withArgs('eventBus').resolves(eventBus);

            eventBus.on.withArgs('fooEvent').returns(eventSubscription);

            return extension.beforeServiceInitialised(null, extensionApi).then(() => {

                extension.onServiceInitialised(service, {
                    subscribe: 'fooEvent'
                });

                subscriptionManager.add.should.have.been.calledWith(service, null);
                subscriptionManager.add.args[0][2].start(startCallback);
                eventSubscription.then.should.have.been.calledWith(startCallback);

                subscriptionManager.add.args[0][2].stop();
                eventSubscription.off.should.have.been.called;

            });

        });
    });

    describe('lintArg', () => {

        it('should return an empty array when publisher has a matching string subscription', () => {

            const extensionApi = containerDoubles.extensionApi();

            extensionApi.container.config.services.fooSubscriber = {
                extras: [{
                    subscribe: 'foo'
                }]
            };

            return extension.lintArg('publish:foo', extensionApi).should.eventually.deep.equal([]);

        });

        it('should return an empty array when publisher has a matching object subscription', () => {

            const extensionApi = containerDoubles.extensionApi();

            extensionApi.container.config.services.fooSubscriber = {
                extras: [{
                    subscribe: {
                        foo: 'bar'
                    }
                }]
            };

            return extension.lintArg('publish:foo', extensionApi).should.eventually.deep.equal([]);

        });

        it('should return an error when publisher has no matching subscription', () => {

            const extensionApi = containerDoubles.extensionApi();

            return extension.lintArg('publish:foo', extensionApi).then((errors) => {
                errors.length.should.equal(1);
                errors[0].should.contain('foo');
            });

        });

    });

});
