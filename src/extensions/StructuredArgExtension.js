import { _, Promise } from '../globals';

/**
 * Use this to define a tree structure where all leaf nodes will be resolved as args
 *
 * Service definition usage examples:
 *
 *      {
 *          structuredArg: {
 *              key: '@arg1',
 *              more: ['@arg2', '%arg3']
 *          }
 *      }
 *
 * The above will resolve all args using any configured arg resolvers before returning
 */
export default class StructuredArgExtension {

    canLoadModule (extensionApi) {
        return !!extensionApi.serviceDefinition.structuredArg;
    }

    canInitialise (extensionApi) {
        return this.canLoadModule(extensionApi);
    }

    initialise (instanceCreatedCallback, loadedModule) {
        return loadedModule;
    }

    loadModule (extensionApi) {

        const args = [];
        const placeholders = mapLeaves(extensionApi.serviceDefinition.structuredArg, (arg) => {
            args.push(arg);
            return args.length - 1;
        });

        return Promise.all(extensionApi.resolveArgs(args)).then((resolvedArgs) => {

            return mapLeaves(placeholders, (placeholder) => {
                return resolvedArgs[placeholder];
            });

        });

    }

}

function concatObject (object, item, key) {
    object[key] = item;
    return object;
}

function concatArray (array, item) {
    return array.concat(item);
}

function mapLeaves (tree, mapFn) {

    let baseIterable;
    let concatFn;

    if (_.isArray(tree)) {

        baseIterable = [];
        concatFn = concatArray;

    } else if (_.isObject(tree)) {

        baseIterable = {};
        concatFn = concatObject;

    } else {
        return mapFn(tree);
    }

    return _.reduce(
        tree,
        (memo, item, key) => concatFn(memo, mapLeaves(item, mapFn), key),
        baseIterable
    );

}
