const base = require("../src/server.js");

base.run({
  logging: "debug",
  authenticate: function (connection, register) {

    register(connection, {
      id: 3,
      name: "Test user"
    })
  }
});