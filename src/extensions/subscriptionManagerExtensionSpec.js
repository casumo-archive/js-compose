/* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
/* eslint-env mocha */

import { _ } from '../globals';
import * as sinon from 'sinon';
import { containerDoubles } from '../../test/doubles';
import SubscriptionManagerExtension from './SubscriptionManagerExtension';

describe('SubscriptionManagerExtension', () => {

    let extension;
    let callbacks;
    let handler;

    beforeEach(() => {

        extension = new SubscriptionManagerExtension();

        callbacks = containerDoubles.subscriptionManagerCallbacks();

        handler = {};

    });

    describe('canResolveArg', () => {

        it('should return true when argDefinition is subscriptionManager', () => {
            extension.canResolveArg('subscriptionManager').should.equal(true);
        });

        it('should return true when argDefinition is anything else', () => {
            extension.canResolveArg('@foo').should.equal(false);
        });

    });

    describe('resolveArg', () => {

        it('should return a promise for itself', () => {

            return extension.resolveArg().then((actual) => {
                actual.should.equal(extension);
            });

        });

    });

    describe('start', () => {

        it('should call the start callback for all added subscriptions of a passed handler', () => {

            const otherCallbacks = containerDoubles.subscriptionManagerCallbacks();

            extension.add(handler, 'first', callbacks);
            extension.add(handler, 'second', otherCallbacks);

            extension.start(handler);

            callbacks.start.should.have.been.called;
            otherCallbacks.start.should.have.been.called;

        });

        it('should call the start callback a specific subscription of a passed handler method', () => {

            const otherCallbacks = containerDoubles.subscriptionManagerCallbacks();

            handler.first = _.noop;

            extension.add(handler, 'first', callbacks);
            extension.add(handler, 'second', otherCallbacks);

            extension.start(handler.first);

            callbacks.start.should.have.been.called;
            otherCallbacks.start.should.not.have.been.called;

        });

        // eslint-disable-next-line max-len
        it('should call the start callback a specific subscription of a passed handler and method name', () => {

            const otherCallbacks = containerDoubles.subscriptionManagerCallbacks();

            handler.first = _.noop;

            extension.add(handler, 'first', callbacks);
            extension.add(handler, 'second', otherCallbacks);

            extension.start(handler, 'first');

            callbacks.start.should.have.been.called;
            otherCallbacks.start.should.not.have.been.called;

        });

        // eslint-disable-next-line max-len
        it('should pass a function to the start callback that will call the handler method with the payload', () => {

            handler.foo = sinon.spy();

            extension.add(handler, 'foo', callbacks);

            extension.start(handler);

            callbacks.start.callArgWith(0, 'payload');

            handler.foo.should.have.been.calledWith('payload');

        });

        // eslint-disable-next-line max-len
        it('should pass a function to the start callback that will call the handler directly when there is no method', () => {

            handler = sinon.spy();

            extension.add(handler, null, callbacks);

            extension.start(handler);

            callbacks.start.callArgWith(0, 'payload');

            handler.should.have.been.calledWith('payload');

        });

    });

    describe('stop', () => {

        it('should call the stop callback for all added subscriptions of a passed handler', () => {

            extension.add(handler, 'foo', callbacks);

            extension.stop(handler);

            callbacks.stop.should.have.been.called;

        });

    });

    describe('dispose', () => {

        // eslint-disable-next-line max-len
        it('should call the stop callback for all added subscriptions of a passed handler and forget them', () => {

            extension.add(handler, 'foo', callbacks);

            extension.dispose(handler);
            extension.start(handler);

            callbacks.stop.should.have.been.called;
            callbacks.start.should.not.have.been.called;

        });

    });

});
