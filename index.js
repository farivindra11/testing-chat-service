require('dotenv').config();
const express = require('express'); 
const path = require('path');
const https = require('https')
const fs = require('fs')
const { Server } = require("socket.io");
const cors = require("cors");
const indexRouter = require('./routes/index');

const app = express();
const sslServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
}, app)


const io = new Server(sslServer, {
    cors: {
        origin: 'http://localhost:3000'
    }
});

let users = []
const addUser = (userId, socketId) => {
    !users.some((user) => user.userId === userId) &&
        users.push({ userId, socketId })
}

const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId)
}

const getUser = (userId) => {
    return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
    console.log('a user connected')
    io.emit("word", "welcome from the server!")

    socket.on("addUser", (userId) => {      //===== add user to room
        console.log(userId, 'from client')
        addUser(userId, socket.id)
        io.emit("getUsers", users)
    })

    //send and get message
    socket.on("sendMessage", ({ senderId, receiverId, text }) => {
        // console.log(senderId, receiverId, text, 'user');
        const user = getUser(receiverId);

        user && io.to(user.socketId).emit("getMessage", {
            senderId,
            text,
        });
    });

    //disconnect remove user
    socket.on("disconnect", () => {
        console.log("user disconnect")
        removeUser(socket.id)
        io.emit("getUsers", users)
    })
})

app.use(cors());
app.use('/chat-service/', indexRouter);

sslServer.listen(3443, () => console.log('secure server run on port 3443'))
module.exports = app;