const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Route
app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/views/chat/index.html');
});

// Alıcı
io.on('connection', (socket) => {

    // Mesajları Dinle
    socket.on('chat message', (msg) => {
        console.log(socket.id + ': ' + msg);
        io.emit('chat message', msg);
    });

    // Gelen Kişiyi Söyle
    socket.on('user', (msg) => {
        console.log( socket.id + ' is connected');
    });

    // Gönder Millete
    socket.broadcast.emit('hi');

    // Ayrılan Kişiyi Söyle
    socket.on('disconnect', (msg) => {
        console.log( socket.id + ' disconnected');
    });

});

// Verici
io.emit('some event', {
    someProperty: 'some value',
    otherProperty: 'other value'
});

// Server
http.listen(3000, () => {
    console.log('listening on *:3000');
});