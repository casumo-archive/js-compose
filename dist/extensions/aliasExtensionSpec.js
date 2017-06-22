define(['../globals', '../../test/doubles', '../../test/moduleLoaders', '../../test/initialisers', './AliasExtension'], function (_globals, _doubles, _moduleLoaders, _initialisers, _AliasExtension) {
    'use strict';

    var _AliasExtension2 = _interopRequireDefault(_AliasExtension);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    describe('AliasExtension', () => {

        let extension;

        beforeEach(() => {
            extension = new _AliasExtension2.default();
        });

        (0, _moduleLoaders.addSpecsForCanLoadModule)('alias', () => extension);

        describe('loadModule', () => {

            it('should return the promise for the resolved arg', () => {

                const extensionApi = _doubles.containerDoubles.extensionApi({
                    serviceDefinition: {
                        alias: 'foo'
                    }
                });
                const instance = {};

                extensionApi.resolveArg.withArgs('foo').resolves(instance);

                return extension.loadModule(extensionApi).should.eventually.equal(instance);
            });
        });

        (0, _initialisers.addSpecsForCanInitialiseWithProperty)('alias', () => extension);

        describe('initialise', () => {

            it('returns provided module', () => {

                const module = {};
                const result = extension.initialise(_globals._.noop, module);

                result.should.equal(module);
            });
        });
    }); /* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
    /* eslint-env mocha */
});