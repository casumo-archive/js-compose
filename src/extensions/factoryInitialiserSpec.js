/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import { _ } from '../globals';
import * as sinon from 'sinon';
import { containerDoubles } from '../../test/doubles';
import FactoryInitialiser from './FactoryInitialiser';

describe('FactoryInitialiser', () => {

    let initialiser;

    beforeEach(() => {
        initialiser = new FactoryInitialiser();
    });

    describe('canInitialise', () => {

        it('returns true when service definition init property is factory', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    init: 'factory'
                }
            });

            initialiser.canInitialise(extensionApi).should.equal(true);

        });

        it('returns false when service definition init property is not factory', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    init: 'not factory'
                }
            });

            initialiser.canInitialise(extensionApi).should.equal(false);

        });

    });

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
