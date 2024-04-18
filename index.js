const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const cors = require("cors");
const { joinRandomRoom, leaveRoom,getRoomID} = require("./controllers/Room");

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
    const room = await joinRandomRoom(socket.id, userData);
    socket.join(room.roomId);
  });

  socket.on("message",async(data)=>{
    // console.log("message is:",messageData);
    // socket.to(messageData.roomId).emit("message",messageData)
    console.log("data received: ",data);
    const roomId = await getRoomID(socket.id)
    if(roomId){
      console.log("Data emitted to : ", roomId);
      socket.to(roomId).emit("message",data)
    }else{
      console.log("Room not found for socket ID:", socket.id);
    }
  })

  socket.on("leave", async () => {
    console.log("leave: ", socket.id);
    const room = await leaveRoom(socket);
  });

  socket.on("disconnect", async () => {
    await leaveRoom(socket);
    console.log("disconnected: ", socket.id, io.engine.clientsCount);
  });
});

// io.of("/").adapter.on("join-room", async (room, id) => {
//   const user = await getUserBySocketIdFromRoom(room, id);
//   console.log("user joine", user);
//   io.to(room).emit("userJoined", user);
// });

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
