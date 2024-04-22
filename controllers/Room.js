const prisma = require("../prisma/index");
async function joinRandomRoom(socketId, userData) {
  const rooms = await prisma.room.findMany();
  if (rooms.length === 0) {
    const room = await prisma.room.create({
      data: {
        name: "room1",
        totalRound: 1,
        currentRound: 1,
        maxUsers: 8,
        users: [
          {
            socketID: socketId,
            score: 0,
            character: userData,
          },
        ],
        roomId: "room1",
      },
    });
    return room;
  } else {
    const room = rooms.find((room) => room.users.length < room.maxUsers);
    if (room) {
      await prisma.room.update({
        where: {
          id: room.id,
        },
        data: {
          users: [
            ...room.users,
            {
              socketID: socketId,
              score: 0,
              character: userData,
            },
          ],
        },
      });
      return room;
    } else {
      const room = await prisma.room.create({
        data: {
          name: `room${rooms.length + 1}`,
          totalRound: 1,
          currentRound: 1,
          maxUsers: 8,
          users: [
            {
              socketID: socketId,
              score: 0,
              character: userData,
            },
          ],
          roomId: `room${rooms.length + 1}`,
        },
      });
      return room;
    }
  }
}
async function leaveRoom(socket) {
  const room = await prisma.room.findFirst({
    where: {
      users: {
        some: {
          socketID: socket.id,
        },
      },
    },
  });

  if (!room) {
    return;
  } else {
    const updatedUsers = room.users.filter(
      (user) => user.socketID !== socket.id
    );

    await prisma.room.update({
      where: {
        id: room.id,
      },
      data: {
        users: updatedUsers,
      },
    });

    socket.leave(room.roomId);

    if (updatedUsers.length === 0) {
      await prisma.room.delete({
        where: {
          id: room.id,
        },
      });
    }
  }
}

async function getRoomID(socket) {
  const room = await prisma.room.findFirst({
    where: {
      users: {
        some: {
          socketID: socket.id,
        },
      },
    },
  });
  if (room) {
    return room.roomId;
  } else {
    return null;
  }
}

// write a function to delete users which are not connnected to sockets, i.e. delete the socketid from users array in the database
async function cleanUpDatabase(io) {
  const rooms = await prisma.room.findMany();
  rooms.forEach(async (room) => {
    const updatedUsers = room.users.filter((user) =>
      io.sockets.sockets.has(user.socketID)
    );
    await prisma.room.update({
      where: {
        id: room.id,
      },
      data: {
        users: updatedUsers,
      },
    });
  });
}

// async function getUserBySocketIdFromRoom(roomId, socketId) {
//   const room = await prisma.room.findFirst({
//     where: {
//       roomId: roomId,
//     },
//     include: {
//       users: true,
//     },
//   });
//   if(room){
//     return room.users.find((user) => user.socketID === socketId);
//   }
//   else{
//     return null;
//   }
// }
module.exports = { joinRandomRoom, leaveRoom, getRoomID, cleanUpDatabase };

//chat event--
// // Retrieve all rooms where this socketId is present in the users array
// const roomsWithUser = await prisma.room.findMany({
//   where: {
//     users: {
//       some: {
//         socketID: socketId,
//       },
//     },
//   },
// });

// // Iterate over each room and remove the user from the users array
// await Promise.all(
//   roomsWithUser.map(async (room) => {
//     const updatedUsers = room.users.filter(
//       (user) => user.socketID !== socketId
//     );

//     // Update the room with the filtered users array
//     await prisma.room.update({
//       where: {
//         id: room.id,
//       },
//       data: {
//         users: updatedUsers,
//       },
//     });

//     // Optional: If no users are left in the room, handle the room accordingly (delete, set inactive, etc.)
//     if (updatedUsers.length === 0) {
//       // Example action: delete the room
//       await prisma.room.delete({
//         where: {
//           id: room.id,
//         },
//       });
//     }
//   })
// );

// // Optionally, you might want to return some status or result here, depending on your application's needs
// return { message: "User removed from all rooms successfully." };
