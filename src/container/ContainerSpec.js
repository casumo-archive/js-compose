/* eslint-env mocha */

import { expect } from 'chai';
import Container from './Container';
import { _ } from '../globals';

describe('Container', function () {

    it('should do something', function () {

        const container = new Container();

        return container.get().then(function (value) {
            expect(_.identity(value)).to.equal(true);
        });
    });

});
