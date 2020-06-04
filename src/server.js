var ws = require("ws");
var users = require("./user-manager");
var logger = require("loglevel");
var clients = require("./client-manager");
var Message = require("./transport").Message;
var listeners = require("./store-events")

// var listeners = {};

module.exports = {
  users: users,
  clients: clients,
  Message: Message,
  store: null,
  // awaitReply: function (message, listener, timeout) {
  //   var id = message.id || (Date.now() + "-" + Math.random());

  //   message.id = id;

  //   if (listeners[id]) {
  //     log("system", "Error: already listening for a message with id " + id);
  //   } else {
  //     listeners[id] = listener;

  //     setTimeout(function () {
  //       delete (listeners[id]);
  //     }, (timeout || 30000));
  //   }
  // },
  broadcast: function (message, uid = null) {
    this.store.publish(uid ? ("/user/" + uid) : "/base/broadcast", message);
  },
  run: function (provided) {
    var options = Object.assign({
      logging: "info",
      port: 9000,
      http: function () { },
      ssl: null,
      store: require("./stores/memory"),
      authenticate: function (connection, register) {
        throw "Please provide a function with key [authenticate] when running Base.";
      },
      pingInterval: 30000
    }, provided);

    options.actions = Object.assign({
      path: require('path').dirname(process.argv[1]) + "/actions",
      public: [],
      resolver: (path, command) => require(path + "/" + command)
    }, options.actions || {});


    var base = this;
    this.store = options.store;

    logger.setLevel(options.logging);

    return this.store.connect().then(() => {
      listeners(options.store);

      if (options.ssl) {
        var httpServer = require("https").createServer(options.ssl, options.http);
      } else {
        var httpServer = require("http").createServer(options.http);
      }

      var server = new ws.Server({
        server: httpServer
      });

      httpServer.listen(options.port, function () {
        logger.info("Server is listening on port " + options.port);
      });

      function register(connection, user) {
        try {
          if (!user || !user.id) {
            throw "not-auth";
          }

          if (connection.readyState !== 1) {
            throw "Can not bind client " + connection.id + " to a user, connection seems to be closing.";
          }

          logger.debug("<client-" + connection.id + ">", "Client authenticated with id " + user.id);

          users.register(user, connection);

          options.store.subscribe("/user/" + user.id, relayMessage);
          options.store.hmset("/user/" + user.id, user);
          options.store.publish("/base/conn-open", user.id);

          connection.send(new Message("authenticated", user).toString());
        } catch (e) {
          if (e === "not-auth") {
            logger.debug(connection.id, "Client is not logged in, closing connection.");
          } else {
            logger.error(connection.id, e);
          }
          return connection.close();
        }
      }

      function relayMessage(message, channel) {
        let uid = channel.split("/").pop();
        let u = users.get(uid);
        if (u) {
          u.send(message);
        }
      }

      function onMessage(message) {
        try {
          var [command, body, id] = JSON.parse(message);
        } catch (e) {
          return logger.debug(this.id, "Invalid message recieved.");
        }

        if (!this.user && options.actions.public.indexOf(command) < 0) {
          logger.debug(this.id, "Client tried to send a message before being authenticated - closing connection.");
          return this.close();
        }
        
        try {
          command = command.replace("..", "");
          options.actions.resolver(options.actions.path, command).call(base, this, new Message(command, body, id));
        } catch (e) {
          logger.debug(this.id, e);
        }
      }

      function onClose() {
        logger.debug("<client-" + this.id + ">", "Connection closed.");
        clients.free(this);
        
        if (this.user) {
          let uid = this.user.id;

          options.store.publish("/base/conn-closed", uid);
          if (users.closed(this)) {
            // no more connections from this user, unlisten their channel
            options.store.unsubscribe("/user/" + uid);
          }
        }
      }

      function heartbeat() {
        this.isAlive = true;
      }

      var interval = setInterval(function () {
        server.clients.forEach(function (conn) {
          if (conn.isAlive === false) {
            conn.emit("close");
            return conn.terminate();
          }

          conn.isAlive = false;
          conn.ping('', false, true);
        });
      }, options.pingInterval);

      server.on('connection', function onOpen(conn) {
        logger.debug("<client-" + clients.assign(conn) + ">", "Incoming connection");

        options.authenticate(conn, register);

        conn.on('message', onMessage);
        conn.on("close", onClose);

        conn.isAlive = true;
        conn.on('pong', heartbeat);
      });

      return server;
    });

  }
};
