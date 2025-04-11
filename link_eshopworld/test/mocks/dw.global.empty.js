'use strict';

module.exports = function empty(global) {
    var emptyfunction = function (obj) {
        return (obj === null || obj === undefined || obj === '' || (typeof (obj) !== 'function' && obj.length !== undefined && obj.length === 0));
    };
    // eslint-disable-next-line no-param-reassign
    global.empty = emptyfunction;
    return global.empty;
};
