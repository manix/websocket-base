module.exports = function (store) {
  let base = require("./server");

  store.subscribe("/base/broadcast", function (message) {
    for (let user of base.users.all()) {
      user.send(message);
    }
  });

  store.subscribe("/base/conn-open", function (message) {
    console.log("User arrived", message, process.pid);
  });

  store.subscribe("/base/conn-closed", function (message) {
    console.log("User left", message, process.pid);
  });
}