/* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
/* eslint-env mocha */

import { containerDoubles } from '../../test/doubles';
import { addSpecsForCanResolveArgMatchingPrefix } from '../../test/argResolvers';
import ParamArgResolver from './ParamArgResolver';

describe('ParamArgResolver', () => {

    let argResolver;

    beforeEach(() => {
        argResolver = new ParamArgResolver();
    });

    addSpecsForCanResolveArgMatchingPrefix('%', () => argResolver);

    describe('resolveArg', () => {

        it('should return a promise for the matching param', () => {

            const extensionApi = containerDoubles.extensionApi();

            extensionApi.container.config.params.foo = 'bar';

            return argResolver.resolveArg('%foo', extensionApi).should.eventually.equal('bar');

        });

        it('should return a promise for the matching nested param', () => {

            const extensionApi = containerDoubles.extensionApi();

            extensionApi.container.config.params.foo = {
                bar: 'foobar'
            };

            return argResolver.resolveArg('%foo.bar', extensionApi).should.eventually.equal('foobar');

        });

    });
});
