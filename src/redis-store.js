const Promise = require("bluebird");
const redis = require("redis");
Promise.promisifyAll(redis);

let subscriber;
let publisher;

exports.listeners = new Map();

exports.connect = function (url) {
  subscriber = redis.createClient(url);
  publisher = redis.createClient(url);

  subscriber.on("message", function (channel, message) {
    if (exports.listeners.has(channel)) {
      exports.listeners.get(channel).call(null, message);
    }
  });

  subscriber.on("error", exports.onerror);
  publisher.on("error", exports.onerror);

  return Promise.resolve(exports);
}

exports.onerror = function (error) {
  console.error('Redis error:', error);
  process.exit(1);
}

exports.set = function (key, value) {
  return publisher.set(key, value);
}

exports.hmset = function (key, object) {
  return publisher.hmset(key, object);
}

exports.hget = function (key, hmkey) {
  return publisher.hget(key, hmkey);
}

exports.hgetall = function (key) {
  return publisher.hgetall(key);
}

exports.get = function (key) {
  return publisher.get(key);
}

exports.del = function (key) {
  return publisher.del(key);
}

exports.incr = function (key, value = 1) {
  return publisher.incrby(key, value);
}

exports.subscribe = function (channel) {
  return subscriber.subscribe(channel);
}

exports.unsubscribe = function (channel) {
  return subscriber.unsubscribe(channel);
}

exports.publish = function (channel, message) {
  return publisher.publish(channel, JSON.stringify(message));
}

exports.on = function (event, listener) {
  return subscriber.on(event, listener);
}

exports.off = function (event, listener) {
  return subscriber.off(event, listener);
}

