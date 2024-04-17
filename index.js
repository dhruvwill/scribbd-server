const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const cors = require("cors");
const { joinRandomRoom, leaveRoom } = require("./controllers/Room");
const { SocketAddress } = require("node:net");

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

  socket.on("join", async (userData) => {
    console.log("join: ", socket.id);
    console.log(userData);
    const room = await joinRandomRoom(socket.id, userData);
    socket.join(room.roomId);
  });

  socket.on("leave", async () => {
    console.log("leave: ", socket.id);
    const room = await leaveRoom(socket);
  });

  socket.on("disconnect", async () => {
    await leaveRoom(socket);
    console.log("disconnected: ", socket.id, io.engine.clientsCount);
  });
});

io.of("/").adapter.on("join-room", (room, id) => {
  console.log(`socket ${io.sockets.sockets.get(id)} has joined room ${room}`);
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
