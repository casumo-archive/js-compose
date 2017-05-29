/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import { containerDoubles } from './doubles';

/**
 * Use this for initialiser extensions which support a specific init value.
 */
export function addSpecsForCanInitialise (initValue, initialiserFactory) {

    describe('canInitialise', () => {

        it(`returns true when service definition init property is ${initValue}`, () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    init: initValue
                }
            });

            initialiserFactory().canInitialise(extensionApi).should.equal(true);

        });

        it(`returns false when service definition init property is not ${initValue}`, () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    init: `not ${initValue}`
                }
            });

            initialiserFactory().canInitialise(extensionApi).should.equal(false);

        });

    });

}

/**
 * Use this for initialisers which expect a certain property on the service definition
 */
export function addSpecsForCanInitialiseWithProperty (property, getTestSubject) {

    describe('canInitialise', () => {

        it(`returns true when extra definition has property ${property}`, () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    [property]: 'foo'
                }
            });

            getTestSubject().canInitialise(extensionApi).should.equal(true);

        });

        it(`returns false when extra definition does not have property ${property}`, () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {}
            });

            getTestSubject().canInitialise(extensionApi).should.equal(false);

        });

    });

}
