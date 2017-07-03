/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import * as sinon from 'sinon';
import { containerDoubles } from '../../test/doubles';
import ExtensionApi from './ExtensionApi';

describe('ExtensionApi', () => {

    it('exposes a container with an extended chain', () => {

        const extensionApi = new ExtensionApi({ chain: [] }, 'foo', {}, () => {});

        extensionApi.container.chain.should.deep.equal(['foo']);

    });

    describe('resolveArg', () => {

        it('uses resolveArgs with the provided single arg definition', () => {

            const resolveArgs = sinon.stub();
            const extensionApi = new ExtensionApi({ chain: [] }, 'foo', {}, resolveArgs);

            resolveArgs.withArgs(sinon.match(['in'])).returns(['out']);

            extensionApi.resolveArg('in').should.equal('out');

        });

    });

    describe('getArgResolver', () => {

        it('should return the first arg resolver that can resolve the arg', () => {

            const argResolver1 = containerDoubles.argResolver();
            const argResolver2 = containerDoubles.argResolver();

            const container = containerDoubles.container({
                argResolvers: [argResolver1, argResolver2]
            });

            const extensionApi = new ExtensionApi(container, 'foo', {}, () => {});

            argResolver1.canResolveArg.returns(false);
            argResolver2.canResolveArg.withArgs('foo').returns(true);

            extensionApi.getArgResolver('foo').should.equal(argResolver2);

        });

        it('should throw an error if there is no arg resolver for an arg', () => {

            const container = containerDoubles.container();

            const extensionApi = new ExtensionApi(container, 'foo', {}, () => {});

            (() => extensionApi.getArgResolver('foo')).should.throw(Error);

        });

    });

});
