function forEach() {
    var args = Array.from(arguments);
    var list = args[0];
    var callback = args[1];
    if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
        list = list.toArray();
    }
    return list ? list.forEach(callback) : null;
}

module.exports = {
    forEach: forEach
}