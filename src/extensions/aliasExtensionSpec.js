/* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
/* eslint-env mocha */

import { _ } from '../globals';
import { containerDoubles } from '../../test/doubles';
import { addSpecsForCanLoadModule } from '../../test/moduleLoaders';
import { addSpecsForCanInitialiseWithProperty } from '../../test/initialisers';
import AliasExtension from './AliasExtension';

describe('AliasExtension', () => {

    let extension;

    beforeEach(() => {
        extension = new AliasExtension();
    });

    addSpecsForCanLoadModule('alias', () => extension);

    describe('loadModule', () => {

        it('should return the promise for the resolved arg', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    alias: 'foo'
                }
            });
            const instance = {};

            extensionApi.resolveArg.withArgs('foo').resolves(instance);

            return extension.loadModule(extensionApi).should.eventually.equal(instance);

        });

    });

    addSpecsForCanInitialiseWithProperty('alias', () => extension);

    describe('initialise', () => {

        it('returns provided module', () => {

            const module = {};
            const result = extension.initialise(_.noop, module);

            result.should.equal(module);

        });

    });

});
