/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import { _ } from '../../globals';
import * as sinon from 'sinon';
import { addSpecsForCanInitialiseIfInitEquals } from '../../../test/initialisers';
import PartialInitialiser from '../PartialInitialiser';

describe('PartialInitialiser', () => {

    let initialiser;

    beforeEach(() => {
        initialiser = new PartialInitialiser();
    });

    addSpecsForCanInitialiseIfInitEquals('partial', () => initialiser);

    describe('initialise', () => {

        it('returns a partially applied function', () => {

            const original = sinon.stub();
            const instance = {};

            original.withArgs('foo', 'bar', 123, 456).returns(instance);

            const result = initialiser.initialise(_.noop, original, 'foo', 'bar');

            result(123, 456).should.equal(instance);

        });

        it('preserves the prototype chain for returned function', () => {

            function Original () {
            }

            const PartiallyApplied = initialiser.initialise(_.noop, Original);

            const result = new PartiallyApplied();

            (result instanceof Original).should.equal(true);

        });

        it('calls the instance created callback for functions', () => {

            const original = sinon.stub();
            const instance = {};
            const instanceCreated = sinon.spy();

            original.returns(instance);

            initialiser.initialise(instanceCreated, original)();

            instanceCreated.should.have.been.calledWith(instance);

        });

        it('calls the instance created callback for constructors', () => {

            const instanceCreated = sinon.spy();

            let instance;

            function Original () {
                instance = this;
            }

            // eslint-disable-next-line no-new
            new (initialiser.initialise(instanceCreated, Original))();

            instanceCreated.should.have.been.calledWith(instance);

        });

    });

});
