var logger = require("loglevel");

module.exports = function (store) {
  let base = require("./server");

  store.subscribe("/base/broadcast", function (message) {
    for (let user of base.users.all()) {
      user.send(message);
    }
  });

  store.subscribe("/base/conn-open", function (user) {
    logger.info("User arrived", user, process.pid);
  });

  store.subscribe("/base/conn-closed", function (user) {
    logger.info("User left", user, process.pid);
  });
}