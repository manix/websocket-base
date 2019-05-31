let data = new Map();

exports.listeners = new Map();

exports.connect = function () {
  return exports;
}

exports.set = function (key, value) {
  return data.set(key, value);
}

exports.hmset = function (key, object) {
  return data.set(key, object);
}

exports.hget = function (key, hmkey) {
  return data.get(key)[hmkey];
}

exports.hgetall = function (key) {
  return data.get(key);
}

exports.get = function (key) {
  return data.get(key);
}

exports.del = function (key) {
  return data.delete(key);
}

exports.incr = function (key, value = 1) {
  return data.set(key, data.get(key) + value);
}

exports.subscribe = function (channel, callback) {
  return exports.listeners.set(channel, callback);
}

exports.unsubscribe = function (channel) {
  return exports.listeners.delete(channel);
}

exports.publish = function (channel, message) {
  if (exports.listeners.has(channel)) {
    exports.listeners.get(channel).call(null, message, channel);
  }
}

exports.on = function (event, listener) {

}

exports.off = function (event, listener) {

}

Object.keys(exports).forEach(key => {
  if (key === "listeners") {
    return;
  }

  (function (o) {
    exports[key] = function () {
      return Promise.resolve(o.apply(null, arguments));
    }
  })(exports[key]);

});