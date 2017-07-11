/* globals global */
const glob = require('glob');
const moreSinonChai = require('more-sinon-chai');
const _ = require('lodash');

require('../src/globals.js').configure(_, Promise);

moreSinonChai.moreSinon(_, Promise, require('sinon'));

global.should = require('chai').should();
require('chai').use(require('chai-as-promised'));
require('chai').use(require('sinon-chai'));
require('chai').use(moreSinonChai.moreChai(_, Promise));

glob.sync('**/*Spec.js').forEach((filePath) => {
    // We trim some information from the filePath as we need to give webpack as much compile time
    // information as possible to optimally resolve these modules.
    const uniquePathPart = filePath.substring(4, filePath.length - 7);

    require(`../src/${uniquePathPart}Spec.js`);
});
