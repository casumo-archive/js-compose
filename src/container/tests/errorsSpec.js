/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import { ArgError, ServiceError } from '../errors';

describe('ServiceError', () => {

    it('should include the service id in its message', () => {

        const e = new ServiceError('foo', new Error('bar'));

        e.message.should.contain('foo');

    });

    it('should include the original error message in its message', () => {

        const e = new ServiceError('foo', new Error('bar'));

        e.message.should.contain('bar');

    });

    it('should use the original error for its stack', () => {

        const original = new Error('bar');
        const e = new ServiceError('foo', original);

        e.stack.should.equal(original.stack);

    });

    it('should use the original entirely if its a ServiceError', () => {

        const original = new ServiceError('foo', new Error('bar'));
        const e = new ServiceError('123', original);

        e.should.equal(original);

    });

});

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

        e.should.equal(original);

    });

    it('should use the original entirely if its a ServiceError', () => {

        const original = new ServiceError('foo', new Error('bar'));
        const e = new ArgError('123', original);

        e.should.equal(original);

    });

});
