/* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
/* eslint-env mocha */

import * as sinon from 'sinon';
import { containerDoubles } from '../../test/doubles';
import { addSpecsForCanLoadModule } from '../../test/moduleLoaders';
import FactoryServiceLoader from './FactoryServiceLoader';

describe('FactoryServiceLoader', () => {

    let loader;

    beforeEach(() => {
        loader = new FactoryServiceLoader();
    });

    addSpecsForCanLoadModule('factoryService', () => loader);

    describe('loadModule', () => {

        it('should return a promise for the factory service from the container', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    factoryService: 'foo'
                }
            });
            const service = {};

            extensionApi.container.get.withArgs('foo').resolves(service);

            return loader.loadModule(extensionApi).should.eventually.equal(service);

        });

        it('should support dot notation to return properties of the service', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    factoryService: 'foo.bar'
                }
            });
            const serviceProperty = {};

            extensionApi.container.get.withArgs('foo').resolves({
                bar: serviceProperty
            });

            return loader.loadModule(extensionApi).should.eventually.equal(serviceProperty);

        });

        it('should bind function properties to their service', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    factoryService: 'foo.bar'
                }
            });
            const service = {
                bar: sinon.spy()
            };

            extensionApi.container.get.withArgs('foo').resolves(service);

            return loader.loadModule(extensionApi).then((factory) => {
                factory();
                service.bar.should.have.been.calledOn(service);
            });

        });

    });

    describe('lint', () => {

        it('should resolve with an empty array when there is a service definition', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    factoryService: 'foo'
                }
            });

            extensionApi.container.config.services.foo = {};

            return loader.lint(extensionApi).should.eventually.deep.equal([]);

        });

        it('should support dot notation', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    factoryService: 'foo.bar'
                }
            });

            extensionApi.container.config.services.foo = {};

            return loader.lint(extensionApi).should.eventually.deep.equal([]);

        });

        it('should resolve with error string if there is no service definition', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    factoryService: 'foo'
                }
            });

            return loader.lint(extensionApi).then((errors) => {

                errors.length.should.equal(1);
                errors[0].should.contain('foo');

            });

        });

    });

});
