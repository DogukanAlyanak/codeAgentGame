var socket = io();

var usernameForm = document.getElementById('usernameForm');
var usernameInput = document.getElementById('usernameInput');
var gameInput = document.getElementById('gameInput');
var sessIDInput = document.getElementById('sessID');

// Form Action --> "submit"
usernameForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let usernameValue = usernameInput.value
    let gameID = gameInput.value
    let sessID = sessIDInput.value

    if (usernameValue != '') {
        socket.emit('set-username', usernameValue, gameID, sessID);
        window.location.href = '/room/' + gameID;
    }
});