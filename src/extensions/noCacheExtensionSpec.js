/* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
/* eslint-env mocha */

import { containerDoubles } from '../../test/doubles';
import NoCacheExtension from './NoCacheExtension';

describe('NoCacheExtension', () => {

    let extension;

    beforeEach(() => {
        extension = new NoCacheExtension();
    });

    describe('canHandleExtra', () => {

        it('should return true for no-cache only', () => {

            extension.canHandleExtra('no-cache').should.equal(true);
            extension.canHandleExtra('not no-cache').should.equal(false);

        });

    });

    describe('onGetComplete', () => {

        it('should clear the current service from the cache', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceId: 'foo'
            });

            extensionApi.container.cache.foo = {};

            extension.onGetComplete('no-cache', extensionApi);

            extensionApi.container.cache.should.not.have.property('foo');

        });

    });
});
