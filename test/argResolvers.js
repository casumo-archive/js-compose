/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

/**
 * Use this for arg resolvers which support a string with specific prefix
 */
export function addSpecsForCanResolveArgMatchingPrefix (prefix, getTestSubject) {

    describe('canResolveArg', () => {

        it(`returns true when arg definition has prefix ${prefix}`, () => {

            getTestSubject().canResolveArg(`${prefix}foo`).should.equal(true);

        });

        it(`returns false when arg definition does not have prefix ${prefix}`, () => {

            getTestSubject().canResolveArg(`not${prefix}foo`).should.equal(false);

        });

    });

}
