/* eslint no-unused-expressions: 0, max-nested-callbacks: 0 */
/* eslint-env mocha */

import * as sinon from 'sinon';
import { containerDoubles } from '../../test/doubles';
import { addSpecsForCanResolveArgMatchingPrefix } from '../../test/argResolvers';
import { addSpecsForCanHandleExtraWithProperty } from '../../test/extraHandlers';
import PubSubExtension from './PubSubExtension';

describe('PubSubExtension', () => {

    let extension;

    beforeEach(() => {
        extension = new PubSubExtension('eventBus');
    });

    addSpecsForCanResolveArgMatchingPrefix('publish:', () => extension);

    describe('resolveArg', () => {

        it('returns a function which loads services subscribing to the event then triggers the event', () => {

            const extensionApi = containerDoubles.extensionApi();
            const eventBus = sinon.stub({
                trigger () {}
            });

            extensionApi.container.get.withArgs('eventBus').resolves(eventBus);

            extensionApi.container.config.services.foo = {
                extras: [
                    {
                        subscribe: 'fooEvent'
                    }
                ]
            };

            extensionApi.container.config.services.bar = {
                extras: [
                    {
                        subscribe: {
                            fooEvent: 'handler'
                        }
                    }
                ]
            };

            return extension.resolveArg('publish:fooEvent', extensionApi).then((publishFooEvent) => {
                return publishFooEvent('foobar');
            }).then(() => {
                extensionApi.container.get.should.have.been.calledWith('foo');
                extensionApi.container.get.should.have.been.calledWith('bar');
                eventBus.trigger.should.have.been.calledWith('fooEvent', 'foobar');
            });

        });

    });

    addSpecsForCanHandleExtraWithProperty('subscribe', () => extension);

});
