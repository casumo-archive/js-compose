/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import { _ } from '../globals';
import * as sinon from 'sinon';
import { addSpecsForCanInitialise } from '../../test/initialisers';
import ConstructorInitialiser from './ConstructorInitialiser';

describe('ConstructorInitialiser', () => {

    let initialiser;

    beforeEach(() => {
        initialiser = new ConstructorInitialiser();
    });

    addSpecsForCanInitialise('constructor', () => initialiser);

    describe('initialise', () => {

        it('returns instance of constructor created with provided arguments', () => {

            const Constructor = sinon.stub();
            const instance = {};

            Constructor.withArgs('foo', 'bar').returns(instance);

            const result = initialiser.initialise(_.noop, Constructor, 'foo', 'bar');

            result.should.equal(instance);
            Constructor.should.have.been.calledWithNew;

        });

        it('calls the instance created callback', () => {

            const instanceCreated = sinon.spy();
            const instance = {};

            initialiser.initialise(instanceCreated, _.constant(instance));

            instanceCreated.should.have.been.calledWith(instance);

        });

    });

});
