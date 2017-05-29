/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import { _ } from '../globals';
import * as sinon from 'sinon';
import { addSpecsForCanInitialiseIfInitEquals } from '../../test/initialisers';
import FactoryInitialiser from './FactoryInitialiser';

describe('FactoryInitialiser', () => {

    let initialiser;

    beforeEach(() => {
        initialiser = new FactoryInitialiser();
    });

    addSpecsForCanInitialiseIfInitEquals('factory', () => initialiser);

    describe('initialise', () => {

        it('returns output of factory invoked with provided arguments', () => {

            const factory = sinon.stub();
            const instance = {};

            factory.withArgs('foo', 'bar').returns(instance);

            const result = initialiser.initialise(_.noop, factory, 'foo', 'bar');

            result.should.equal(instance);

        });

        it('calls the instance created callback', () => {

            const instanceCreated = sinon.spy();
            const instance = {};

            initialiser.initialise(instanceCreated, _.constant(instance));

            instanceCreated.should.have.been.calledWith(instance);

        });

    });

});
