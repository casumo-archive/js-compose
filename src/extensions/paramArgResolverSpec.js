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

    describe('lint', () => {

        it('should resolve with an empty array for an existing param', () => {

            const extensionApi = containerDoubles.extensionApi();

            extensionApi.container.config.params.foo = 'bar';

            return argResolver.lint('%foo', extensionApi).should.eventually.deep.equal([]);

        });

        it('should resolve with an error message for non-existent param', () => {

            const extensionApi = containerDoubles.extensionApi();

            return argResolver.lint('%foo', extensionApi).then((errors) => {
                errors.length.should.equal(1);
                errors[0].should.contain('foo');
            });

        });

        it('should resolve with an error message for non-existent nested param', () => {

            const extensionApi = containerDoubles.extensionApi();

            extensionApi.container.config.params.foo = {};

            return argResolver.lint('%foo.bar', extensionApi).then((errors) => {
                errors.length.should.equal(1);
                errors[0].should.contain('foo.bar');
            });

        });

    });

});
