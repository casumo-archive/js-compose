/* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
/* eslint-env mocha */

import { _, Promise } from '../../globals';
import * as sinon from 'sinon';
import { containerDoubles } from '../../../test/doubles';
import { addSpecsForCanLoadModule } from '../../../test/moduleLoaders';
import { addSpecsForCanInitialiseWithProperty } from '../../../test/initialisers';
import StructuredArgExtension from '../StructuredArgExtension';

describe('StructuredArgExtension', () => {

    let extension;

    beforeEach(() => {
        extension = new StructuredArgExtension();
    });

    addSpecsForCanLoadModule('structuredArg', () => extension);

    describe('loadModule', () => {

        it('should support an array of args as a definition', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    structuredArg: ['foo', 'bar']
                }
            });

            extensionApi.resolveArgs
                .withArgs(sinon.match(['foo', 'bar']))
                .returns([Promise.resolve(123), Promise.resolve(456)]);

            return extension.loadModule(extensionApi).then((result) => {
                result.should.deep.equal([123, 456]);
            });

        });

        it('should support an tree of args as a definition', () => {

            const extensionApi = containerDoubles.extensionApi({
                serviceDefinition: {
                    structuredArg: {
                        foo: 'foo',
                        bar: {
                            foobar: ['bar']
                        }
                    }
                }
            });

            extensionApi.resolveArgs
                .withArgs(sinon.match(['foo', 'bar']))
                .returns([Promise.resolve(123), Promise.resolve(456)]);

            return extension.loadModule(extensionApi).then((result) => {
                result.should.deep.equal({
                    foo: 123,
                    bar: {
                        foobar: [456]
                    }
                });
            });

        });

    });

    addSpecsForCanInitialiseWithProperty('structuredArg', () => extension);

    describe('initialise', () => {

        it('returns provided module', () => {

            const module = {};
            const result = extension.initialise(_.noop, module);

            result.should.equal(module);

        });

    });

});
