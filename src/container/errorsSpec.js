/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import { ArgError } from './errors';

describe('ArgError', () => {

    it('should include the arg definition in its message', () => {

        const e = new ArgError('foo', new Error('bar'));

        e.message.should.contain('foo');

    });

    it('should include the original error message in its message', () => {

        const e = new ArgError('foo', new Error('bar'));

        e.message.should.contain('bar');

    });

    it('should use the original error for its stack', () => {

        const original = new Error('bar');
        const e = new ArgError('foo', original);

        e.stack.should.equal(original.stack);

    });

    it('should use the original entirely if its an ArgError', () => {

        const original = new ArgError('foo', new Error('bar'));
        const e = new ArgError('123', original);

        e.message.should.equal(original.message);
        e.stack.should.equal(original.stack);

    });

});
