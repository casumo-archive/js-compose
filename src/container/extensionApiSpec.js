/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import * as sinon from 'sinon';
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

});
