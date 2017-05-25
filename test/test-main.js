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
require('../src/extensions/factoryInitialiserSpec.js');
require('../src/extensions/factoryServiceLoaderSpec.js');
require('../src/extensions/noCacheExtensionSpec.js');
require('../src/extensions/paramArgResolverSpec.js');
require('../src/extensions/partialInitialiserSpec.js');
require('../src/extensions/pubSubExtensionSpec.js');
require('../src/extensions/returnInitialiserSpec.js');
require('../src/extensions/structuredArgExtensionSpec.js');
require('../src/extensions/subscriptionManagerExtensionSpec.js');
