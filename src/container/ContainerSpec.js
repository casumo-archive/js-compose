import { expect } from 'chai';
import * as Container from './Container';
import { _, Promise } from '../globals';

describe('Container', function () {

    it('should do something', function () {
        return Promise.resolve().then(function () {
            expect(_.identity(true)).to.equal(true);
        });
    });

});
