/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import { _ } from '../globals';
import * as sinon from 'sinon';
import { addSpecsForCanInitialiseIfInitEquals } from '../../test/initialisers';
import ReturnInitialiser from './ReturnInitialiser';

describe('ReturnInitialiser', () => {

    let initialiser;

    beforeEach(() => {
        initialiser = new ReturnInitialiser();
    });

    addSpecsForCanInitialiseIfInitEquals('return', () => initialiser);

    describe('initialise', () => {

        it('returns provided module', () => {

            const module = {};
            const result = initialiser.initialise(_.noop, module);

            result.should.equal(module);

        });

        it('calls the instance created callback', () => {

            const instanceCreated = sinon.spy();
            const module = {};

            initialiser.initialise(instanceCreated, module);

            instanceCreated.should.have.been.calledWith(module);

        });

    });

});
