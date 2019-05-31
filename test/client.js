const ws = require("ws");

let client = new ws("ws://localhost:9000");

client.on("message", (e) => {
  console.log("Got message", e);
});