var http = require("http");
var ws = require("ws");
var users = require("./user-manager");
var log = require("./simple-logger").log;
var clients = require("./client-manager");
var Message = require("./transport").Message;

var listeners = {};

module.exports = {
  users: users,
  clients: clients,
  Message: Message,
  awaitReply: function (message, listener, timeout) {
    var id = message.id || (Date.now() + "-" + Math.random());

    message.id = id;

    if (listeners[id]) {
      log("system", "Error: already listening for a message with id " + id);
    } else {
      listeners[id] = listener;

      setTimeout(function () {
        delete(listeners[id]);
      }, (timeout || 30000));
    }
  },
  broadcast: function (message) {
    for (var u in users.all()) {
      users.get(u).send(message);
    }
  },
  run: function (provided) {
    var base = this;

    var options = Object.assign({
      port: 9000,
      http: function () {},
      ssl: null,
      authenticate: function (connection, register) {
        throw "Please provide a function with key [authenticate] when running Base.";
      },
      onLastConnectionClosed: function (user) {
        // this will run when a connection gets closed and there are no more connections from this user.
      }
    }, provided);

    options.actions = Object.assign({
      path: require('path').dirname(process.argv[1]) + "/actions",
      public: []
    }, options.actions || {});

    if (options.ssl) {
      var httpServer = require("https").createServer(options.ssl, options.http);
    } else {
      var httpServer = require("http").createServer(options.http);
    }

    var server = new ws.Server({
      port: provided.http ? null : options.port,
      server: httpServer
    });

    httpServer.listen(options.port, function () {
      log("system", "Server is listening on port " + options.port);
    });

    function register(connection, user) {
      try {
        if (!user) {
          throw "not-auth";
        }

        if (connection.readyState !== 1) {
          throw "Can not bind client " + connection.id + " to a user - bad readyState.";
        }

        log("system", "Client " + connection.id + " authenticated with id " + user.id);

        users.register(user, connection);

        connection.send(new Message("authenticated", user).toString());
      } catch (e) {
        if (e === "not-auth") {
          log("system", "Client " + connection.id + " is not logged in, closing connection.");
          return connection.close();
        }
      }
    }

    function onMessage(message) {
      try {
        var [command, body, id] = JSON.parse(message);
      } catch (e) {
        return log(this.id, "Invalid message recieved.");
      }

      if (!this.user && options.actions.public.indexOf(command) < 0) {
        log("system", "Client " + this.id + " tried to send a message before being authenticated - closing connection.");
        return this.close();
      }

      try {
        var action;

        if (listeners[id]) {
          action = listeners[id];
        } else {
          command = command.replace("..", "");

          action = require(options.actions.path + "/" + command);
        }

        action.call(base, this, new Message(command, body, id));
      } catch (e) {
        log(this.id, e);
      }
    }

    function onClose() {
      log(this.id, "Connection closed.");
      users.closed(this, options.onLastConnectionClosed);
      clients.free(this);
    }

    function heartbeat() {
      this.isAlive = true;
    }

    var interval = setInterval(function () {
      server.clients.forEach(function (conn) {
        if (conn.isAlive === false) {
          return conn.terminate();
        }

        conn.isAlive = false;
        conn.ping('', false, true);
      });
    }, 30000);

    function onOpen(conn) {
      log("system", "Incoming connection, assigned id: " + clients.assign(conn));
      log("system", "Beginning authentication for " + conn.id);

      options.authenticate(conn, register);

      conn.on('message', onMessage);
      conn.on("close", onClose);

      conn.isAlive = true;
      conn.on('pong', heartbeat);
    }

    server.on('connection', onOpen);

    return server;
  }
};
