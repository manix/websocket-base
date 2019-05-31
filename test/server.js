const base = require("../src/server.js");

base.run({
  logging: "debug",
  store: require("../src/stores/memory"),
  authenticate: function (connection, register) {

    register(connection, {
      id: 3,
      name: "Test user"
    });

    setTimeout(() => {
      base.broadcast(new base.Message("DGD", "BRAT"), 3);
    }, 5000)
  }
});