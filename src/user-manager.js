var logger = require("loglevel");

/*
 * All connected users
 */
var users = {};

/*
 * The User class represents a physical user, person.
 */
class User {

  constructor(data) {
    this.id = 0;

    for (var i in data) {
      this[i] = data[i];
    }

    /*
     * Hold all connections by this user.
     */
    this.connections = {};
  }

  /*
   * Bind a websocket connection to this user.
   */
  bindConnection(conn) {
    if (this.connections[conn.id]) {
      // if you see this, something got really messed up.
      throw "Can not add connection because one already exists at this id.";
    }

    this.connections[conn.id] = conn;
    conn.user = this;

    logger.info("<user-manager>", "Bound client " + conn.id + " to " + this);
  }

  unbindConnection(conn) {
    delete (this.connections[conn.id]);
    delete (conn.user);

    logger.info("<user-manager>", "Unbound client " + conn.id + " from " + this);
  }

  /*
   * Send a Message to all connections of this user.
   */
  send(message) {
    for (var i in this.connections) {
      logger.info("<user-manager>", "Sending message to " + this.connections[i].id);
      this.connections[i].send(message);
    }
  }

  toString() {
    return this.id;
  }
}

module.exports = {
  /*
   * Register a new user in the memory database from session data.
   */
  register: function (data, connection) {
    if (!data.id) {
      throw "Can not register user without id";
    }

    /*
     * Check if user already registered in memory.
     */
    var user = this.get(data.id);

    /*
     * If not then create a new user instance.
     */
    if (!user) {
      user = new User(data);
      users[user.id] = user;
    }

    /*
     * Bind the connection that requested the register method, to the appropriate user instance.
     */
    if (connection) {
      user.bindConnection(connection);
    }

    return user;
  },
  /*
   * Get a user from memory.
   */
  get: function (id) {
    return users[id];
  },
  all: function () {
    return users;
  },

  closed: function (conn) {
    if (!conn.user) {
      return;
    }

    delete (conn.user.connections[conn.id]);

    if (Object.keys(conn.user.connections).length === 0) {

      delete (users[conn.user.id]);

      return true;
    }
  }
};
