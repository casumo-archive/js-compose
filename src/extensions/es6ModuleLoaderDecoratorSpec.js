/* globals should */
/* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
/* eslint-env mocha */

import { containerDoubles } from '../../test/doubles';
import ES6ModuleLoaderDecorator from './ES6ModuleLoaderDecorator';

describe('ES6ModuleLoaderDecorator', () => {

    let decorated;
    let loader;
    let extensionApi;

    beforeEach(() => {
        decorated = containerDoubles.moduleLoader();
        loader = new ES6ModuleLoaderDecorator(decorated);
    });

    describe('canLoadModule', () => {

        it('should return true when decorated extension canLoadModule returns true', () => {
            const extensionApi = containerDoubles.extensionApi();

            decorated.canLoadModule.withArgs(extensionApi).returns(true);
            loader.canLoadModule(extensionApi).should.equal(true);
        });

        it('should return false when decorated extension canLoadModule returns false', () => {
            decorated.canLoadModule.withArgs(extensionApi).returns(false);
            loader.canLoadModule(extensionApi).should.equal(false);
        });

    });

    describe('loadModule', () => {

        it('should return the default export if default available', () => {

            const extensionApi = containerDoubles.extensionApi();
            const expected = {};

            decorated.loadModule.withArgs(extensionApi).resolves({
                default: expected
            });

            return loader.loadModule(extensionApi).should.eventually.equal(expected);

        });

        it('should return the module from decorated if default not available', () => {

            const extensionApi = containerDoubles.extensionApi();
            const expected = {};

            decorated.loadModule.withArgs(extensionApi).resolves(expected);

            return loader.loadModule(extensionApi).should.eventually.equal(expected);

        });

    });

    describe('lint', () => {

        it('should defer to decorated', () => {

            const extensionApi = containerDoubles.extensionApi();
            const expected = [];

            decorated.lint.withArgs(extensionApi).resolves(expected);

            return loader.lint(extensionApi).should.eventually.equal(expected);

        });

        it('should return void when decorated has no lint function', () => {

            const extensionApi = containerDoubles.extensionApi();

            delete decorated.lint;

            should.not.exist(loader.lint(extensionApi));

        });

    });

});
