module.exports = function (store) {
  let base = require("./server");

  store.listeners.set("/base/broadcast", function (message) {
    for (let user of base.users.all()) {
      user.send(message);
    }
  });

  store.listeners.set("/base/conn-open", function (message) {
    console.log("EGOE USERA", message, process.pid);
  });

  store.listeners.set("/base/conn-closed", function (message) {
    console.log("CIAO USERA", message, process.pid);
  });

  store.subscribe("/base/broadcast");
  store.subscribe("/base/conn-open");
  store.subscribe("/base/conn-closed");
}