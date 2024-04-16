const prisma = require("../prisma/index");
const { io } = require("../index");
async function joinRandomRoom(socketId) {
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
            },
          ],
          roomId: rooms.length + 1,
        },
      });
      return room;
    }
  }
}
async function leaveRoom(socketId) {
  // Retrieve all rooms where this socketId is present in the users array
  const roomsWithUser = await prisma.room.findMany({
    where: {
      users: {
        some: {
          socketID: socketId,
        },
      },
    },
  });

  // Iterate over each room and remove the user from the users array
  await Promise.all(
    roomsWithUser.map(async (room) => {
      const updatedUsers = room.users.filter(
        (user) => user.socketID !== socketId
      );

      // Update the room with the filtered users array
      await prisma.room.update({
        where: {
          id: room.id,
        },
        data: {
          users: updatedUsers,
        },
      });

      // Optional: If no users are left in the room, handle the room accordingly (delete, set inactive, etc.)
      if (updatedUsers.length === 0) {
        // Example action: delete the room
        await prisma.room.delete({
          where: {
            id: room.id,
          },
        });
      }
    })
  );

  // Optionally, you might want to return some status or result here, depending on your application's needs
  return { message: "User removed from all rooms successfully." };
}

module.exports = { joinRandomRoom, leaveRoom };
