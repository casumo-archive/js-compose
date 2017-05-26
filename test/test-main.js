const glob = require('glob');

require('../src/globals.js').configure(
    require('lodash'),
    Promise
);

require('chai').should();
require('chai').use(require('chai-as-promised'));
require('chai').use(require('sinon-chai'));
require('chai').use(require('./moreSinonChai').default);

glob.sync('**/*Spec.js').forEach((filePath) => {
    // We trim some information from the filePath as we need to give webpack as much compile time
    // information as possible to optimally resolve these modules.
    const uniquePathPart = filePath.substring(4, filePath.length - 7);

    require(`../src/${uniquePathPart}Spec.js`);
});
