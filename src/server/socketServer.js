// socketServer.js
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: "http://localhost:3000" });

const corsOptions = {
  origin: "http://localhost:3000", // Replace with the URL of your Next.js application
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  return res.send("What's up?");
});

// You can add your Socket.io event handlers here
// For example, handle 'connection' event
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("send_message", (data) => {
    io.emit("send_message", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const port = 4000; // You can change this to any available port you want
server.listen(port, () => {
  console.log(`Socket.io server listening on http://localhost:${port}`);
});
