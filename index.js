require('dotenv').config();
const { Server } = require("socket.io");
const { PROXY_CLIENT_URL, SERVER } = process.env

const io = new Server({ cors: PROXY_CLIENT_URL });

//=========== users online ===========
let users = []      

//========= function operate =======
//add user
const addUser = (userId, socketId) => { 
    !users.some((user) => user.userId === userId) &&
        users.push({ userId, socketId })
}
//remove user
const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId)
}
//get user online
const getUser = (userId) => {
    return users.find((user) => user.userId === userId);
};

//========== socket connection ===============
io.on("connection", (socket) => {
    console.log('a user connected')
    io.emit("word", "welcome from the server!")

    //===== add user to room ==
    socket.on("addUser", (userId) => {        // take event from client
        console.log(userId, 'add user from client')
        addUser(userId, socket.id)
        io.emit("getUsers", users)          // send users data to client
    })

    //===== send and get message + notification =====
    socket.on("sendMessage", ({ senderId, receiverId, text }) => {
        console.log(senderId, receiverId, text, 'message data from client');
        const user = getUser(receiverId);   //=== check user online ======

        if (user) {
            io.to(user.socketId).emit("getMessage", {   //======= send get message to client ==========
                senderId,
                text,
            });
            io.to(user.socketId).emit("getNotification", {   //======= send notification to client ==========
                senderId: senderId,
                isRead: false,
            });
        }else{
            console.log('user tidak online');
            //disini bisa untuk menyimpan data post ke api
        }

    });

    //==== disconnect remove user ====
    socket.on("disconnect", () => {
        console.log("user disconnect")
        removeUser(socket.id)
        io.emit("getUsers", users)
    })
})


io.listen(SERVER)