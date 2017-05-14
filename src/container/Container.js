import { Promise } from '../globals';

export default class Container {

    /**
     * @param {string} id
     *
     * @return {Promise}
     */
    get () {
        return Promise.resolve(true);
    }

}
