
io.on('connection', function (socket) {
    console.log('a user connected');
    console.log(socket.id);
});


io.to(socketid).emit('message', 'for your eyes only');

// ? io.sockets.emit("test_case_changed", "test1");
// ? io.emit("test_case_changed", "test2");

https://socket.io/docs/v3/rooms/