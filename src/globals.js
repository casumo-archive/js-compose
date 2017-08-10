/**
 * These APIs have several equivalent libraries and builds so the purpose of
 * this module is to avoid locking the container to any specific one and allow
 * consumers to decide. This makes dependency management a lot easier but comes
 * with some risks which can be allieviated with unit tests.
 */
import lodash from 'lodash';
import bluebird from 'bluebird';

export let _ = lodash;
export let Promise = bluebird;

export function configure ({
    underscoreModule,
    PromiseConstructor
}) {
    if (underscoreModule) {
        _ = underscoreModule;
    }

    if (PromiseConstructor) {
        Promise = PromiseConstructor;
    }
}
