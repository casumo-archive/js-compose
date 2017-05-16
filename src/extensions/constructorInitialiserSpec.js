/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import { _ } from '../globals';
import * as sinon from 'sinon';
import { containerDoubles } from '../../test/doubles';
import ConstructorInitialiser from './ConstructorInitialiser';

describe('ConstructorInitialiser', () => {

    let initialiser;

    beforeEach(() => {
        initialiser = new ConstructorInitialiser();
    });

    describe('canInitialise', () => {

        it('returns true when service definition init property is constructor', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    init: 'constructor'
                }
            });

            initialiser.canInitialise(extensionApi).should.equal(true);

        });

        it('returns false when service definition init property is not constructor', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    init: 'not constructor'
                }
            });

            initialiser.canInitialise(extensionApi).should.equal(false);

        });

    });

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
