var logger = require("loglevel");

module.exports = function (store) {
  let base = require("./server");

  store.subscribe("/base/broadcast", function (message) {
    let users = base.users.all();
    Object.keys(users).forEach(key => {
      users[key].send(message);
    });
  });

  store.subscribe("/base/conn-open", function (conn) {
    logger.info("User arrived", conn.user.id, process.pid);
  });

  store.subscribe("/base/conn-closed", function (conn) {
    logger.info("User left", conn.user.id, process.pid);
  });
}