const express = require('express')
const app = express();
let https = require('https').Server(app);
const port = process.env.PORT || 3000
let io = require('socket.io')(https)

app.use(express.static('public'))

https.listen(port, ()=>{
    console.log('conectado en el puerto', port);
})

io.on('connection', socket => {
    console.log('usuario conectado')
    socket.on('create or join', room =>{
        console.log('create or join', room)
        const myRoom = io.sockets.adapter.rooms[room] || {length:0}
        const numclientes = myRoom.length
        console.log(room, 'tiene',numclientes, 'Clientes')
        if(numclientes == 0){
            socket.join(room)
            socket.emit('created', room)

        }else if(numclientes == 1){
            socket.join(room)
            socket.emit('joined', room)
        }else{
            socket.emit('full', room)
        }
    })

    socket.on('ready', room =>{
        socket.broadcast.to(room).emit('ready')
    })

    socket.on('candidate', event =>{
        socket.broadcast.to(event.room).emit('candidate', event)
    })

    socket.on('offer', event =>{
        socket.broadcast.to(event.room).emit('offer', event.sdp)
    })

    socket.on('answer', event =>{
        socket.broadcast.to(event.room).emit('answer', event.sdp)
    })
})