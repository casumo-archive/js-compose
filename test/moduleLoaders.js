/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import { containerDoubles } from './doubles';

/**
 * Use this for module loader extensions which support a specific property.
 */
export function addSpecsForCanLoadModule (property, loaderFactory) {

    describe('canLoadModule', () => {

        it(`returns true when service definition has property ${property}`, () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    [property]: 'foo'
                }
            });

            loaderFactory().canLoadModule(extensionApi).should.equal(true);

        });

        it(`returns false when service definition does not have property ${property}`, () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                }
            });

            loaderFactory().canLoadModule(extensionApi).should.equal(false);

        });

    });

}
