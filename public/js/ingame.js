var socket = io();

// Buttons
var joinRedAgentsBtn = document.getElementById('joinRedAgentsButton');
var joinRedCommandsBtn = document.getElementById('joinRedCommandsButton');
var joinBlueAgentsBtn = document.getElementById('joinBlueAgentsButton');
var joinBlueCommandsBtn = document.getElementById('joinBlueCommandsButton');

// Lists
var gameSpectators = document.getElementsByClassName("game-spectators");
var gameBlueAgents = document.getElementById("blueAgentList");
var gameBlueCommanders = document.getElementById("blueCommandList");
var gameRedAgents = document.getElementById("redAgentList");
var gameRedCommanders = document.getElementById("redCommandList");




// GO SERVER ==>
// START PAGE
window.onload = function () {
    console.log('on loaded');
    document.getElementById("playersHomeButton").click()

    if (thisPlayerUsername == '') {
        $('#usernameModal').modal('show')
    }

    //setInterval(() => {
    //    location.reload();
    //}, 1000);

    // JOIN GAME ==> UPDATE SPECTATORS- REQUEST
    socket.emit('joinGame', gameID, sessID);
};


// When JOIN RED AGENTS
var jonRedAgentBtn = document.getElementById('joinRedAgentsButton');
jonRedAgentBtn.addEventListener("click", function (e) {
    socket.emit('joinRedAgentGroup', gameID, sessID);
})

// When JOIN RED COMMANDERS
var jonRedCommanderBtn = document.getElementById('joinRedCommandsButton');
jonRedCommanderBtn.addEventListener("click", function (e) {
    socket.emit('joinRedCommanderGroup', gameID, sessID);
})

// When JOIN BLUE AGENTS
var jonBlueAgentBtn = document.getElementById('joinBlueAgentsButton');
jonBlueAgentBtn.addEventListener("click", function (e) {
    socket.emit('joinBlueAgentGroup', gameID, sessID);
})

// When JOIN BLUE COMMANDERS
var jonBlueCommanderBtn = document.getElementById('joinBlueCommandsButton');
jonBlueCommanderBtn.addEventListener("click", function (e) {
    socket.emit('joinBlueCommanderGroup', gameID, sessID);
})


var test
// COME SERVER <==
// START ==> JOIN GAME ==> Update Spectator Data - RESPONSE
socket.on('updatePlayerStatus', function (e) {
    console.log(e);
    test = e

    // teams => variables
    let spectators = e.PLAYER_SPECTATORS
    let blueTeamAgents = e.BLUE_TEAM_AGENTS
    let blueTeamCommanders = e.BLUE_TEAM_COMMANDERS
    let redTeamAgents = e.RED_TEAM_AGENTS
    let redTeamCommanders = e.RED_TEAM_COMMANDERS

    let spectatorKeys = Object.keys(e.PLAYER_SPECTATORS)
    let blueTeamAgentsKeys = Object.keys(e.BLUE_TEAM_AGENTS)
    let blueTeamCommandersKeys = Object.keys(e.BLUE_TEAM_COMMANDERS)
    let redTeamAgentsKeys = Object.keys(e.RED_TEAM_AGENTS)
    let redTeamCommandersKeys = Object.keys(e.RED_TEAM_COMMANDERS)

    // Update Spectators
    if (spectatorKeys.length == 0) {
        gameSpectators.innerHTML = '';}
    let spectatorsView = ``
    spectatorKeys.forEach(player => {
        spectatorsView += `<li>${spectators[player].USERNAME}</li>`
        gameSpectators.innerHTML = spectatorsView
    });

    // Update Blue Team Agent
    if (blueTeamAgentsKeys.length == 0) {
        gameBlueAgents.innerHTML = '';}
    let blueAgentsView = ``
    blueTeamAgentsKeys.forEach(player => {
        blueAgentsView += `<li>${blueTeamAgents[player].USERNAME}</li>`
        gameBlueAgents.innerHTML = blueAgentsView
    });

    // Update Blue Team Commanders
    if (blueTeamCommandersKeys.length == 0) {
        gameBlueCommanders.innerHTML = '';}
    let blueCommandersView = ``
    blueTeamCommandersKeys.forEach(player => {
        blueCommandersView += `<li>${blueTeamCommanders[player].USERNAME}</li>`
        gameBlueCommanders.innerHTML = blueCommandersView
    });

    // Update Red Team Agent
    if (redTeamAgentsKeys.length == 0) {
        gameRedAgents.innerHTML = '';}
    let redAgentsView = ``
    redTeamAgentsKeys.forEach(player => {
        redAgentsView += `<li>${redTeamAgents[player].USERNAME}</li>`
        gameRedAgents.innerHTML = redAgentsView
    });

    // Update Red Team Commanders
    if (redTeamCommandersKeys.length == 0) {
        gameRedCommanders.innerHTML = '';}
    let redCommandersView = ``
    redTeamCommandersKeys.forEach(player => {
        redCommandersView += `<li>${redTeamCommanders[player].USERNAME}</li>`
        gameRedCommanders.innerHTML = redCommandersView
    });
});





// UPDATE PLAYER NAME
var updatePlayerNameBtn = document.getElementById('playerNameUpdateModalButton');
var updatePlayerNameInput = document.getElementById('playerNameModalInput');
var thisPlayerNameViewButton = document.getElementById('playersHomeButton');

updatePlayerNameBtn.addEventListener("click", function (e) {
    let playerName = updatePlayerNameInput.value
    thisPlayerNameViewButton.innerHTML = `${playerName}  &nbsp;<i class="fas fa-user-friends"></i>`
    socket.emit('updatePlayerName', gameID, sessID, playerName);
    $('#usernameModal').modal('hide')
})