const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const redis = require("redis");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const redisClient = redis.createClient();

// Express route for joining a room
app.get("/join/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  // Add user to the room
  redisClient.sadd(`room:${roomId}:users`, req.query.userId, (err, added) => {
    if (err) {
      console.error(err);
      res.status(500).send("Failed to add user to room");
      return;
    }

    if (added === 1) {
      // Room was created, add to list of active rooms
      redisClient.sadd("active_rooms", roomId);
    }

    res.send(`Joined room ${roomId}`);
  });
});

io.on("connection", (socket) => {
  socket.on("join", (data) => {
    const roomId = data.roomId;
    const userId = data.userId;
    // Add user to the room
    redisClient.sadd(`room:${roomId}:users`, userId, (err, added) => {
      if (err) {
        console.error(err);
        return;
      }

      if (added === 1) {
        // Room was created, add to list of active rooms
        redisClient.sadd("active_rooms", roomId);
      }

      // Store the user's current room
      redisClient.hset("user_room_mapping", userId, roomId);
      // Join the Socket.IO room
      socket.join(roomId);
    });
  });

  socket.on("message", (data) => {
    const roomId = data.roomId;
    // Broadcast message to all users in the room
    io.to(roomId).emit("message", {
      roomId,
      message: data.message,
    });
  });

  socket.on("disconnect", () => {
    // Remove user from the room
    const userId = getUserIdFromSocket(socket);
    redisClient.hget("user_room_mapping", userId, (err, roomId) => {
      if (err) {
        console.error(err);
        return;
      }
      redisClient.srem(`room:${roomId}:users`, userId, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        // Check if the room is empty
        redisClient.smembers(`room:${roomId}:users`, (err, userIds) => {
          if (err) {
            console.error(err);
            return;
          }
          if (userIds.length === 0) {
            // Delete the room if it's empty
            redisClient.srem("active_rooms", roomId);
            // Also delete the room from Redis
            redisClient.del(`room:${roomId}:users`);
          }
        });
      });
      // Remove user's current room mapping
      redisClient.hdel("user_room_mapping", userId);
    });
  });
});

// Helper function to extract user ID from Socket.IO socket
function getUserIdFromSocket(socket) {
  // This is a simplified example, you would need to implement your own logic
  // to extract and return the user ID from the Socket.IO socket
  return socket.userId;
}

server.listen(3000, () => {
  console.log("Server started on port 3000");
});
