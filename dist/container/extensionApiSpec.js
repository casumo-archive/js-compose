define(['sinon', './ExtensionApi'], function (_sinon, _ExtensionApi) {
    'use strict';

    var sinon = _interopRequireWildcard(_sinon);

    var _ExtensionApi2 = _interopRequireDefault(_ExtensionApi);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _interopRequireWildcard(obj) {
        if (obj && obj.__esModule) {
            return obj;
        } else {
            var newObj = {};

            if (obj != null) {
                for (var key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
                }
            }

            newObj.default = obj;
            return newObj;
        }
    }

    /* eslint no-unused-expressions: 0 */
    /* eslint-env mocha */

    describe('ExtensionApi', () => {

        it('exposes a container with an extended chain', () => {

            const extensionApi = new _ExtensionApi2.default({ chain: [] }, 'foo', {}, () => {});

            extensionApi.container.chain.should.deep.equal(['foo']);
        });

        describe('resolveArg', () => {

            it('uses resolveArgs with the provided single arg definition', () => {

                const resolveArgs = sinon.stub();
                const extensionApi = new _ExtensionApi2.default({ chain: [] }, 'foo', {}, resolveArgs);

                resolveArgs.withArgs(sinon.match(['in'])).returns(['out']);

                extensionApi.resolveArg('in').should.equal('out');
            });
        });
    });
});