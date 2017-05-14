/**
 * These APIs have several equivalent libraries and builds so the purpose of
 * this module is to avoid locking the container to any specific one and allow
 * consumers to decide. This makes dependency management a lot easier but comes
 * with some risks which can be allieviated with unit tests.
 */

export let _;

export let Promise;

export function configure (
    underscoreModule,
    PromiseConstructor
) {
    _ = underscoreModule;
    Promise = PromiseConstructor;
}
