const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const cors = require("cors");
const { joinRandomRoom, leaveRoom } = require("./controllers/Room");

const app = express();
const server = createServer(app);
const PORT = 3000;
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://admin.socket.io"],
    credentials: true,
  },
});

instrument(io, {
  auth: false,
});

io.on("connection", (socket) => {
  console.log("connected: ", socket.id, io.engine.clientsCount);

  socket.on("join", async () => {
    console.log("join: ", socket.id);
    await joinRandomRoom(socket.id);
  });

  socket.on("disconnect", async () => {
    console.log("disconnected: ", socket.id, io.engine.clientsCount);
    await leaveRoom(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
