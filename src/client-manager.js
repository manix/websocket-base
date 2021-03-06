var logger = require("loglevel");

var clients = {};

function generateId(seed) {
  return seed + 1;
};

module.exports = {
  get: function(id) {
    return clients[id];
  },
  all: function() {
    return clients;
  },
  assign: function(connection) {
    var id = generateId(0);
    while (clients[id]) {
      id = generateId(id);
    }

    clients[id] = connection;
    connection.id = id;

    return connection.id;
  },
  free: function(connection) {
    logger.info("<client-manager>", "Freeing id " + connection.id);
    delete(clients[connection.id]);
  }
};
