const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const session = require('express-session');
const path = require('path');
const port = 3000


// Set Views
app.set('views', './views')
app.set('view engine', 'ejs')


// Static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true
}))

var users = {}
var socketUsers = []
var games = []


app.get('', (req, res) => {
    let sessID = parseInt(Math.random(0, 99) * 10000000000000)
    if (!req.session.sessID) {
        req.session.sessID = sessID
        req.session.sessUsername = ''
    }
    res.render('index', { 
        sessID: req.session.sessionID,
        sessUsername: req.session.sessUsername,
    })
})




io.on('connection', (socket) => {

    // Mesajları Dinle
    socket.on('gamein', (sessID, username) => {
        let obj = {
            USERNAME: username
        }

        let socketID = socket.id
        socketUsers[socketID] = sessID

        users[sessID] = obj

        console.log(JSON.stringify(users))
    });

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

// Socket IO - Server
http.listen(port, () => {
    console.log(`listening on *:${port}`);
});