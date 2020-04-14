var logger = require("loglevel");

module.exports = function (store) {
  let base = require("./server");

  store.subscribe("/base/broadcast", function (message) {
    let all = base.users.all();
    for (let id in all) {
      if (all[id]) {
        all[id].send(message);
      }
    }
  });

  store.subscribe("/base/conn-open", function (user) {
    logger.info("User arrived", user, process.pid);
  });

  store.subscribe("/base/conn-closed", function (user) {
    logger.info("User left", user, process.pid);
  });
}