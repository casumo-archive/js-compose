/* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
/* eslint-env mocha */

import { containerDoubles } from '../../test/doubles';
import { addSpecsForCanResolveArgMatchingPrefix } from '../../test/argResolvers';
import DeferredArgResolver from './DeferredArgResolver';

describe('DeferredArgResolver', () => {

    let argResolver;

    beforeEach(() => {
        argResolver = new DeferredArgResolver();
    });

    addSpecsForCanResolveArgMatchingPrefix('defer:', () => argResolver);

    describe('resolveArg', () => {

        it('should return a promise for the deferred arg requested in a new stack frame', () => {

            const extensionApi = containerDoubles.extensionApi();
            const instance = {};

            extensionApi.resolveArg.withArgs('foo').resolves(instance);

            const result = argResolver.resolveArg('defer:foo', extensionApi);

            extensionApi.resolveArg.should.not.have.been.called;

            return result.should.eventually.equal(instance);

        });

    });
});
