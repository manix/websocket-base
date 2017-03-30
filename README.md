# Websocket Base

Base is a foundation for a WebSocket server with a foreign user management system. Foreign meaning it is not handled within the websocket server itself.

For example lets say you have a PHP application. You want to set up a WebSocket server using your existing users - Base allows you to do that easily!

## How to use

Base relies on `ws`, arguably the fastest websocket implementation for javascript, to handle the communication. All you need to do is require `websocket-base` in your application and run it.

    var base = require("websocket-base");

    base.run({
      port: <port>,
      authenticate: function(connection, register) {
        // do your magic to get a user object and then
        register(connection, user);
      },
      actions: {
        path: <path>,
        public: [
          // array of actions that can be called without authentication.
        ]
      }
    });

By default, Base does not allow users to send messages before they have been authenticated and the authenticate callable is where the magic happens. It gets called whenever a new connection is made to the websocket server. You get a [connection](https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocket) instance as the first parameter and a `register` callable as the second one. Based on the connection (or not) you must get a hold of a user object that represents the currently authenticated user in your application. The only requirement for the user object is that it **has to have** an `ìd` property and it must be unique. After you have that object you simply pass it to `register` and the user is now connected. In case you determine that the connection is coming from an unauthenticated user you can call `register(false)` to terminate the connection.

*Note*: You can create a user management system within Base and still have it working perfectly fine, but that's not its purpose.

### Structure

Base constructs an in-memory database of all connected users, which you can access via `base.users`. Generally you should avoid modifications of any kind and only use it for reading, however if you absolutely *must*, be cautious because this might break your application and cause silent errors that are very hard to find.

    users {
      <id>: User {
        id: <id>,
        connections: {
          <connection-id>: WebSocket {
            // <connection-id> is an arbitrary integer, assigned when the connection is established.
            id: <connection-id>,
            user: User {
              // circular referrence to the user this connection belongs to.
            }
          },
          ...
        },
        // whatever else information you provide to the register callable
      },
      ...
    }

### Communicating

The communication works kind of like JSON RPC except a response is not always required and keys are omitted from the message.

Message structure

    "[<command>, <body>, <id>]"

Where `command` is the action that must be executed on the recipient's side, `body` is any arbitrary information and `id` is an *optional* unique identifier for the message, used when a response is needed.

#### Sending messages

* **From the server**
The `User` class has a neat method called `send` which you can use to send a message to all connections from this user. Occasionally you will need to send a message to a specific connection, then you can call `send` on the particular connection.

      var message = new base.Message(<command>, <body>);

      // to a user
      base.users.get(<id>).send(message);

      // to a connection
      base.users.get(<id>).connections[<connection-id>].send(message);

* **From the client**

      ws.send(JSON.stringify([<command>, <body>]);

#### Receiving messages

* **On the server**
Recieved messages are handled by actions on the server. An action is simply a function that takes in two parameters - a connection the message came from and the message itself. Actions must be declared as modules, so you must tell Base where to look for these modules using the `actions.path` property when calling `base.run`
An example action that replies to the message `["hello", "world"]`.

      // file must be named "hello" and reside in the actions directory
      module.exports = function(connection, message) {
          connection.send(message.respond("alert", "Hello, " + message.body + "!"));
      }

* **On the client**
Handling the message sent from the example above, displaying the body in an alert.

      ws.onmessage = function(message) {
        try {
          var [command, body] = JSON.parse(message.data);

          switch (command) {
            case "alert":
              alert(body);
              break;
          }
        } catch (e) {
          throw "Invalid message.";
        }
      }
