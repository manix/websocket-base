/*
 * Overwrite the default send method of `ws` to accept our Message class.
 */
(function (websocket) {
  var send = websocket.prototype.send;

  websocket.prototype.send = function (data, ...x) {

    if (data instanceof Message) {
      data = data.toString();
    }

    return send.call(this, data, ...x);
  };
})(require("ws/lib/WebSocket"))

class Message {
  constructor(command, body, id) {
    this.command = command;
    this.body = body;
    this.id = id;
  }

  respond(command, body) {
    return new Message(command, body, this.id);
  }

  toString() {
    return JSON.stringify([
      this.command,
      this.body,
      this.id
    ]);
  }
}

module.exports = {
  Message: Message
};
