/* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
/* eslint-env mocha */

import { _ } from '../../globals';
import { containerDoubles } from '../../../test/doubles';
import { addSpecsForCanLoadModule } from '../../../test/moduleLoaders';
import { addSpecsForCanInitialiseWithProperty } from '../../../test/initialisers';
import AliasExtension from '../AliasExtension';

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

    describe('lintLoader', () => {

        it('should resolve with an empty array when there is an arg resolver for the aliased arg', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    alias: 'foo'
                }
            });

            extensionApi.getArgResolver.withArgs('foo').returns({});

            return extension.lintLoader(extensionApi).should.eventually.deep.equal([]);

        });

        it('should resolve with an array containing an error string if there is no arg resolver', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    alias: 'foo'
                }
            });

            extensionApi.getArgResolver.throws();

            return extension.lintLoader(extensionApi).then((errors) => {
                errors.length.should.equal(1);
            });

        });

    });

});
