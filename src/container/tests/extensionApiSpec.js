/* eslint no-unused-expressions: 0 */
/* eslint-env mocha */

import sinon from 'sinon';
import _ from 'lodash';
import { containerDoubles } from '../../../test/doubles';
import { ArgError } from '../errors';
import ExtensionApi from '../ExtensionApi';

describe('ExtensionApi', () => {
    let container;
    let serviceId;
    let serviceDefinition;
    let extensionApi;

    beforeEach(() => {
        container = containerDoubles.container();
        serviceId = 'foo';
        serviceDefinition = {};
        extensionApi = new ExtensionApi(container, serviceId, serviceDefinition);
    });

    it('exposes a container with an extended chain', () => {
        extensionApi.container.chain.should.deep.equal([serviceId]);
    });

    it('exposes a the methods of the container', () => {
        _.isUndefined(extensionApi.container.get).should.be.false;
        _.isUndefined(extensionApi.container.lint).should.be.false;
    });

    describe('getArgResolver', () => {

        it('should return the first arg resolver that can resolve the arg', () => {

            const argResolver1 = containerDoubles.argResolver();
            const argResolver2 = containerDoubles.argResolver();

            container = containerDoubles.container({
                argResolvers: [argResolver1, argResolver2]
            });

            extensionApi = new ExtensionApi(container, serviceId, serviceDefinition);

            argResolver1.canResolveArg.returns(false);
            argResolver2.canResolveArg.withArgs(serviceId).returns(true);

            extensionApi.getArgResolver(serviceId).should.equal(argResolver2);

        });

        it('should throw an error if there is no arg resolver for an arg', () => {

            (() => extensionApi.getArgResolver('foo')).should.throw(Error);

        });

    });

    describe('resolveArg', () => {

        it('should return a promise for the resolved arg from the arg resolver', () => {

            const argResolver = containerDoubles.argResolver();

            sinon.stub(extensionApi, 'getArgResolver');
            extensionApi.getArgResolver.withArgs(serviceId).returns(argResolver);

            argResolver.resolveArg.withArgs(serviceId, extensionApi).resolves('bar');

            return extensionApi.resolveArg(serviceId).should.eventually.equal('bar');

        });

        it('should return a promise rejected with ArgError if there is no arg resolver', () => {

            sinon.stub(extensionApi, 'getArgResolver');
            extensionApi.getArgResolver.throws();

            return extensionApi.resolveArg(serviceId).should.be.rejectedWith(ArgError);

        });

        it('should return a promise rejected with ArgError if arg resolver rejects', () => {

            const argResolver = containerDoubles.argResolver();

            sinon.stub(extensionApi, 'getArgResolver');
            extensionApi.getArgResolver.returns(argResolver);

            argResolver.resolveArg.withArgs(serviceId, extensionApi).rejects(new Error('foo error'));

            return extensionApi.resolveArg(serviceId).should.be.rejectedWith(ArgError);

        });

    });

    describe('resolveArgs', () => {

        it('should return an array of resolved args', () => {

            sinon.stub(extensionApi, 'resolveArg');

            extensionApi.resolveArg.withArgs('foo').resolves('123');
            extensionApi.resolveArg.withArgs('bar').resolves('456');

            return Promise.all(extensionApi.resolveArgs(['foo', 'bar']))
                .should.eventually.deep.equal(['123', '456']);

        });

    });

});
