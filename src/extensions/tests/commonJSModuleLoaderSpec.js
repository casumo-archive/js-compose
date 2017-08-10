/* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
/* eslint-env mocha */

import path from 'path';
import { containerDoubles } from '../../../test/doubles';
import { addSpecsForCanLoadModule } from '../../../test/moduleLoaders';
import CommonJSModuleLoader from '../CommonJSModuleLoader';

describe('CommonJSModuleLoader', () => {

    let loader;

    beforeEach(() => {
        loader = new CommonJSModuleLoader();
    });

    addSpecsForCanLoadModule('module', () => loader);

    describe('loadModule', () => {

        it('should return a promise for the module in the definition', () => {

            const module = require('../CommonJSModuleLoader');
            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    module
                }
            });

            return loader.loadModule(extensionApi).should.eventually.equal(module);

        });

        it('should support property attribute to return a specific export from the module', () => {

            const module = require('../CommonJSModuleLoader');
            const expected = module.default;
            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    module,
                    property: 'default'
                }
            });

            return loader.loadModule(extensionApi).should.eventually.equal(expected);

        });

    });

});
