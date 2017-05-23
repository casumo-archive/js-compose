/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

/**
 * Use this for extra handlers which expect a certain property on the extra definition
 */
export function addSpecsForCanHandleExtraWithProperty (property, getTestSubject) {

    describe('canHandleExtra', () => {

        it(`returns true when extra definition has property ${property}`, () => {

            getTestSubject().canHandleExtra({[property]: 'foo'}).should.equal(true);

        });

        it(`returns false when extra definition does not have property ${property}`, () => {

            getTestSubject().canHandleExtra({}).should.equal(false);

        });

    });

}
