require('../src/globals.js').configure(
    require('lodash'),
    Promise
);

require('chai').should();
require('chai').use(require('chai-as-promised'));
require('chai').use(require('sinon-chai'));
require('chai').use(require('./moreSinonChai').default);

require('../src/container/containerSpec.js');
require('../src/container/extensionApiSpec.js');
require('../src/extensions/constructorInitialiserSpec.js');
