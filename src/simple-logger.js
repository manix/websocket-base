module.exports = {
  log: function (callerId, message, level = "log") {
    console[level](new Date().toISOString() + " " + callerId + ": " + message);
  }
};
