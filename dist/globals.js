(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.globals = mod.exports;
    }
})(this, function (exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.configure = configure;
    /**
     * These APIs have several equivalent libraries and builds so the purpose of
     * this module is to avoid locking the container to any specific one and allow
     * consumers to decide. This makes dependency management a lot easier but comes
     * with some risks which can be allieviated with unit tests.
     */

    let _ = exports._ = undefined;

    let Promise = exports.Promise = undefined;

    function configure(underscoreModule, PromiseConstructor) {
        exports._ = _ = underscoreModule;
        exports.Promise = Promise = PromiseConstructor;
    }
});