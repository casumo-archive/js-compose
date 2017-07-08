/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import * as sinon from 'sinon';
import { containerDoubles } from '../../test/doubles';
import { ArgError } from './errors';
import ExtensionApi from './ExtensionApi';

describe('ExtensionApi', () => {

    it('exposes a container with an extended chain', () => {

        const extensionApi = new ExtensionApi({ chain: [] }, 'foo', {});

        extensionApi.container.chain.should.deep.equal(['foo']);

    });

    describe('getArgResolver', () => {

        it('should return the first arg resolver that can resolve the arg', () => {

            const argResolver1 = containerDoubles.argResolver();
            const argResolver2 = containerDoubles.argResolver();

            const container = containerDoubles.container({
                argResolvers: [argResolver1, argResolver2]
            });

            const extensionApi = new ExtensionApi(container, 'foo', {});

            argResolver1.canResolveArg.returns(false);
            argResolver2.canResolveArg.withArgs('foo').returns(true);

            extensionApi.getArgResolver('foo').should.equal(argResolver2);

        });

        it('should throw an error if there is no arg resolver for an arg', () => {

            const container = containerDoubles.container();

            const extensionApi = new ExtensionApi(container, 'foo', {});

            (() => extensionApi.getArgResolver('foo')).should.throw(Error);

        });

    });

    describe('resolveArg', () => {

        it('should return a promise for the resolved arg from the arg resolver', () => {

            const extensionApi = new ExtensionApi(containerDoubles.container(), 'foo', {});
            const argResolver = containerDoubles.argResolver();

            sinon.stub(extensionApi, 'getArgResolver');
            extensionApi.getArgResolver.withArgs('foo').returns(argResolver);

            argResolver.resolveArg.withArgs('foo', extensionApi).resolves('bar');

            return extensionApi.resolveArg('foo').should.eventually.equal('bar');

        });

        it('should return a promise rejected with ArgError if there is no arg resolver', () => {

            const extensionApi = new ExtensionApi(containerDoubles.container(), 'foo', {});

            sinon.stub(extensionApi, 'getArgResolver');
            extensionApi.getArgResolver.throws();

            return extensionApi.resolveArg('foo').should.be.rejectedWith(ArgError);

        });

        it('should return a promise rejected with ArgError if arg resolver rejects', () => {

            const argResolver = containerDoubles.argResolver();
            const extensionApi = new ExtensionApi(containerDoubles.container(), 'foo', {});

            sinon.stub(extensionApi, 'getArgResolver');
            extensionApi.getArgResolver.returns(argResolver);

            argResolver.resolveArg.withArgs('foo', extensionApi).rejects(new Error('foo error'));

            return extensionApi.resolveArg('foo').should.be.rejectedWith(ArgError);

        });

    });

    describe('resolveArgs', () => {

        it('should return an array of resolved args', () => {

            const extensionApi = new ExtensionApi(containerDoubles.container(), 'foo', {});

            sinon.stub(extensionApi, 'resolveArg');

            extensionApi.resolveArg.withArgs('foo').resolves('123');
            extensionApi.resolveArg.withArgs('bar').resolves('456');

            return Promise.all(extensionApi.resolveArgs(['foo', 'bar']))
                .should.eventually.deep.equal(['123', '456']);

        });

    });

});
