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

        it('should return a function which returns a promise for the deferred arg', () => {

            const extensionApi = containerDoubles.extensionApi();
            const instance = {};

            extensionApi.resolveArg.withArgs('foo').resolves(instance);

            const deferredResult = argResolver.resolveArg('defer:foo', extensionApi);
            const result = deferredResult();

            return result.should.eventually.equal(instance);

        });

        it('should eagerly resolve the deferred service without calling the resolved function', () => {

            const extensionApi = containerDoubles.extensionApi();

            extensionApi.resolveArg.withArgs('foo').resolves({});

            argResolver.resolveArg('defer:foo', extensionApi);

            return extensionApi.resolveArg.withArgs('foo').should.eventuallyBeCalled();

        });

    });
});
