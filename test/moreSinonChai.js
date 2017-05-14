import { _, Promise } from '../src/globals';
import * as sinon from 'sinon';

/**
 * Use this to stub a promise which you can manually resolve later.
 */
sinon.stub.promises = function() {

    var resolvePromise,
        rejectPromise,
        promise = new Promise(function(resolve, reject) {
            resolvePromise = resolve;
            rejectPromise = reject;
        });

    return _.extend(this.returns(promise), {
        promise: promise,
        resolvePromise: resolvePromise,
        rejectPromise: rejectPromise
    });
};

/**
 * Use this to stub a promise resolved with value.
 */
sinon.stub.resolves = function(value) {
    return this.returns(Promise.resolve(value));
};

/**
 * Use this to stub a promise rejected with error.
 */
sinon.stub.rejects = function(error) {
    return this.returns(Promise.reject(error));
};

export default function moreSinonChai (chai, utils) {

    utils.addMethod(chai.Assertion.prototype, 'eventuallyBeCalled', function() {
        var stub = this._obj;

        return new Promise(function(resolve, reject) {

            stub.defaultBehavior = _.extend({
                invoke: function(context, args) {
                    resolve(_.toArray(args));
                }
            });

            if (stub.callCount > 0) {
                resolve(stub.firstCall.args);
            }

        });
    });

}
