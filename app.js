const fs = require('fs');
const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const session = require('express-session');
const path = require('path');
const port = 3000
const uniqid = require('uniqid');
const e = require('express');


// Set Views
app.set('views', './views')
app.set('view engine', 'ejs')


// Static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))
app.use('/font', express.static(__dirname + 'public/font'))
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true
}))


// General Variables
var gameList = []
var games = []
var words





// --- CREATE ROOM | Route --- ///////////////////////////////////////////////////
app.get('/createroom', (req, res) => {



    // Session
    let sessID = parseInt(Math.random(0, 99) * 1000000000000000000)
    let sessUsername = ''
    if (!req.session.sessID) {
        req.session.sessID = sessID
        req.session.sessUsername = sessUsername
    } else {
        sessID = req.session.sessID
        sessUsername = req.session.sessUsername
    }




    // Create Room --> Go Room 
    let newGameCode = uniqid();
    newGameCode = newGameCode.substring(newGameCode.length - 6).toUpperCase();

    // Game List & Game is create
    gameList.push(newGameCode)
    games[newGameCode] = {
        GAME_CODE: newGameCode,
        STATUS: "active",
        ADMIN: sessID,
        PLAYERS: [sessID],
        PLAYER_DATA: []
    }

    // take Words
    createRound(newGameCode)

    // Username Control
    if (isNaN(sessUsername) == true || sessUsername == '') {
        res.render('createroom', { newGameCode, sessID })
    } else {
        res.redirect(302, "http://" + req.headers['host'] + '/room/' + newGameCode)
    }
})






// --- ROOM | Route --- ///////////////////////////////////////////////////
app.get('/room/:gameid', (req, res) => {
    gameID = req.params.gameid;
    console.log(games[gameID]);


    // Session
    let sessID
    if (!req.session.sessID) {
        sessID = parseInt(Math.random(0, 99) * 1000000000000000000)
        req.session.sessID = sessID
        games[gameID].PLAYER_DATA[sessID] = { SESSION_ID: sessID, USERNAME: '' };
    } else {
        sessID = req.session.sessID
    }


    let sessUsername

    if (games[gameID].PLAYER_DATA[sessID].USERNAME === undefined) {
        sessUsername = ''
    } else {
        sessUsername = games[gameID].PLAYER_DATA[sessID].USERNAME
    }




    // game control --> route "gameroom.ejs"
    let isGame = gameList.indexOf(gameID)

    let thisGame = games[gameID];
    let thisGameRound = thisGame.ROUNDS[thisGame.ROUNDS.length - 1]

    let cards = JSON.stringify(thisGameRound.CARD_WORDS);

    let blueSideAgent = JSON.stringify(thisGameRound.AGENTS.BLUE_SIDE_AGENT);
    let redSideAgent = JSON.stringify(thisGameRound.AGENTS.RED_SIDE_AGENT);


    if (isGame === -1) {
        res.redirect(302, "http://" + req.headers['host'])
    } else {
        res.render('gameroom', { gameID, sessID, sessUsername, cards, redSideAgent, blueSideAgent })
    }
})






// --- HOME | Route --- ///////////////////////////////////////////////////
app.get('', (req, res) => {

    // Session
    let sessID = parseInt(Math.random(0, 99) * 1000000000000000000)
    let sessUsername = ''
    if (!req.session.sessID) {
        req.session.sessID = sessID
        req.session.sessUsername = sessUsername
    } else {
        sessID = req.session.sessID
        sessUsername = req.session.sessUsername
    }


    res.render('home', { sessID })
})


// Socket IO - Server
http.listen(port, () => {
    console.log(`listening on *:${port}`);
});

// ***************************************************************************** //
// --- SOCKET IO - LISTENER --- ///////////////////////////////////////////////////
io.on('connection', (socket) => {
    const socketID = socket.id

    // Join Game ==> Spectators
    socket.on('joinGame', (gameID, sessID) => {
        socket.join(gameID);
        games[gameID].PLAYER_DATA[sessID].SOCKET_ID = socketID;
        console.log(sessID + ` "${games[gameID].PLAYER_DATA[sessID].USERNAME}" oyuna katıldı`);
        console.log(games[gameID]);
        joinSpectatorData(gameID, sessID)



    });











    // Join Game ==> RED AGENTS
    socket.on('joinRedAgentGroup', (gameID, sessID) => {
        joinRedAgents(gameID, sessID)
        emitPlayerData(gameID)
    });

    // Join Game ==> RED COMMANDERS
    socket.on('joinRedCommanderGroup', (gameID, sessID) => {
        joinRedCommanders(gameID, sessID)
        emitPlayerData(gameID)
    });

    // Join Game ==> BLUE AGENTS
    socket.on('joinBlueAgentGroup', (gameID, sessID) => {
        joinBlueAgents(gameID, sessID)
        emitPlayerData(gameID)
    });

    // Join Game ==> BLUE COMMANDERS
    socket.on('joinBlueCommanderGroup', (gameID, sessID) => {
        joinBlueCommanders(gameID, sessID)
        emitPlayerData(gameID)
    });











    // Set Username -Create Room
    socket.on('set-username', (username, gameID, sessID) => {
        socket.join(gameID);

        gameID = gameID.trim()
        sessID = sessID.trim()
        username = username.trim()

        // Record On Session --> sessUsername
        session.sessUsername = username

        console.log(games);

        // Create User Info 
        games[gameID].PLAYER_DATA[sessID] = {
            SESSION_ID: sessID,
            USERNAME: username,
            SOCKET_ID: socketID
        }
    });


    // UPDATE PLAYER NAME
    socket.on('updatePlayerName', (gameID, sessID, playerName) => {
        socket.join(gameID);

        games[gameID].PLAYER_DATA[sessID].USERNAME = playerName
        joinSpectatorData(gameID, sessID)
    });
});



// CREATE WORD DATA [25]
function createWordData(newGameCode) {
    let game = games[newGameCode];
    let gameWords = []
    let wordsLength
    fs.readFile('words.json', 'utf8', function (err, data) {

        // Pull Words
        words = JSON.parse(data);
        wordsLength = Object.keys(words).length

        // Set Create Word ID List count 25 
        let gameWordIDList = []
        do {
            let ran = Math.floor(Math.random() * wordsLength) + 1
            if (gameWordIDList.indexOf(ran) === -1) {
                gameWordIDList.push(ran)
            }
        } while (gameWordIDList.length < 25);

        // Set game words for this game
        gameWordIDList.forEach(wordID => {
            gameWords.push(words[wordID])
        });


        if (game.ROUNDS == undefined) {
            game.ROUNDS = [{ CARD_WORDS: gameWords }]
        } else {
            game.ROUNDS[game.ROUNDS.length - 1].CARD_WORDS = gameWords
        }
    });

    let setInt = setInterval(() => {
        if (game.ROUNDS[game.ROUNDS.length - 1].CARD_WORDS != undefined) {
            clearInterval(setInt)
            console.log(game.ROUNDS[game.ROUNDS.length - 1]);
        }
    }, 400);
}



function createRound(newGameCode) {
    createWordData(newGameCode)

    let game = games[newGameCode];
    let randNumber = rand(25, 1)

    let redTeamCount = 8;           // need found card count  !! -- max : 9 -- !!
    let blueTeamCount = 8;          // need found card count  !! -- max : 9 -- !!

    // CARDS
    let cards = {};
    let usedCardNumbers = [randNumber];

    // BLACK CARD
    cards.BLACK_CARD = randNumber

    // RED CARDS
    let redCards = [];
    do {
        randNumber = rand(25, 1)
        if (usedCardNumbers.indexOf(randNumber) === -1) {
            usedCardNumbers.push(randNumber)
            redCards.push(randNumber)
        }
    } while (redCards.length < redTeamCount);
    cards.RED_CARDS = redCards


    // BLUE CARDS
    let blueCards = [];
    do {
        randNumber = rand(25, 1)
        if (usedCardNumbers.indexOf(randNumber) === -1) {
            usedCardNumbers.push(randNumber)
            blueCards.push(randNumber)
        }
    } while (blueCards.length < blueTeamCount);
    cards.BLUE_CARDS = blueCards







    // AGENTS
    let agents = {};
    randNumber = rand(20, 1)
    let usedAgentNumbers = [randNumber];


    // RED SIDE AGENT
    agents.RED_SIDE_AGENT = randNumber


    // BLUE SIDE AGENT
    let blueSideAgent = '';
    do {
        randNumber = rand(20, 1)
        if (usedAgentNumbers.indexOf(randNumber) === -1) {
            usedAgentNumbers.push(randNumber)
            blueSideAgent = randNumber
        }
    } while (blueSideAgent == '');
    agents.BLUE_SIDE_AGENT = blueSideAgent


    // RED CARDS AGENTS
    let redCardAgents = [];
    do {
        randNumber = rand(25, 1)
        if (usedAgentNumbers.indexOf(randNumber) === -1) {
            usedAgentNumbers.push(randNumber)
            redCardAgents.push(randNumber)
        }
    } while (redCardAgents.length < redTeamCount);
    agents.RED_CARD_AGENTS = redCardAgents


    // BLUE CARDS AGENTS
    let blueCardAgents = [];
    do {
        randNumber = rand(25, 1)
        if (usedAgentNumbers.indexOf(randNumber) === -1) {
            usedAgentNumbers.push(randNumber)
            blueCardAgents.push(randNumber)
        }
    } while (blueCardAgents.length < blueTeamCount);
    agents.BLUE_CARD_AGENTS = blueCardAgents


    if (game.ROUNDS == undefined) {
        game.ROUNDS = [{
            CARDS: cards,
            AGENTS: agents
        }]
    } else {
        game.ROUNDS[game.ROUNDS.length - 1].CARDS = cards
        game.ROUNDS[game.ROUNDS.length - 1].AGENTS = agents
    }
}











// Functions
function rand(max, min = 0) {
    let ran
    do {
        ran = Math.floor(Math.random() * (max - min) + min);
    } while (min > ran || max < ran);
    return ran;
}

function removePLayer(value, arr) {
    let keys = Object.keys(arr)
    let newArray = []
    keys.forEach(e => {
        if (e != value) {
            newArray[e] = arr[e]
        }
    });
    return newArray
}







// Data Spectator Player
function spectatorPlayers(gameID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.PLAYER_SPECTATORS == undefined) {
        return round.PLAYER_SPECTATORS = []
    } else {
        return round.PLAYER_SPECTATORS
    }
}


// Data Red Team Agents Player
function redAgentPlayers(gameID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.RED_TEAM == undefined) {
        round.RED_TEAM = []
    }

    if (round.RED_TEAM.AGENTS == undefined) {
        return round.RED_TEAM.AGENTS = []
    } else {
        return round.RED_TEAM.AGENTS
    }
}


// Data Red Team Commanders Player
function redCommanderPlayers(gameID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.RED_TEAM == undefined) {
        round.RED_TEAM = []
    }

    if (round.RED_TEAM.COMMANDERS == undefined) {
        return round.RED_TEAM.COMMANDERS = []
    } else {
        return round.RED_TEAM.COMMANDERS
    }
}


// Data Blue Team Agents Player
function blueAgentPlayers(gameID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.BLUE_TEAM == undefined) {
        round.BLUE_TEAM = []
    }

    if (round.BLUE_TEAM.AGENTS == undefined) {
        return round.BLUE_TEAM.AGENTS = []
    } else {
        return round.BLUE_TEAM.AGENTS
    }
}


// Data Blue Team Commanders Player
function blueCommanderPlayers(gameID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.BLUE_TEAM == undefined) {
        round.BLUE_TEAM = []
    }

    if (round.BLUE_TEAM.COMMANDERS == undefined) {
        return round.BLUE_TEAM.COMMANDERS = []
    } else {
        return round.BLUE_TEAM.COMMANDERS
    }
}









// Remove Spectator Funciton
function removeSpectator(gameID, sessID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    let group = round.PLAYER_SPECTATORS
    games[gameID].ROUNDS[games[gameID].ROUNDS.length - 1].PLAYER_SPECTATORS
        = removePLayer(sessID, group)


}


// Remove Blue Commmander Funciton
function removeBlueCommander(gameID, sessID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.BLUE_TEAM == undefined) {
        round.BLUE_TEAM = []
    }

    if (round.BLUE_TEAM.COMMANDERS == undefined) {
        round.BLUE_TEAM.COMMANDERS = []
    }

    let group = round.BLUE_TEAM.COMMANDERS
    games[gameID].ROUNDS[games[gameID].ROUNDS.length - 1].BLUE_TEAM.COMMANDERS
        = removePLayer(sessID, group)


}


// Remove Blue Agent Funciton
function removeBlueAgent(gameID, sessID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.BLUE_TEAM == undefined) {
        round.BLUE_TEAM = []
    }

    if (round.BLUE_TEAM.AGENTS == undefined) {
        round.BLUE_TEAM.AGENTS = []
    }

    let group = round.BLUE_TEAM.AGENTS
    games[gameID].ROUNDS[games[gameID].ROUNDS.length - 1].BLUE_TEAM.AGENTS
        = removePLayer(sessID, group)


}


// Remove Red Commmander Funciton
function removeRedCommander(gameID, sessID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.RED_TEAM == undefined) {
        round.RED_TEAM = []
    }

    if (round.RED_TEAM.COMMANDERS == undefined) {
        round.RED_TEAM.COMMANDERS = []
    }

    let group = round.RED_TEAM.COMMANDERS
    games[gameID].ROUNDS[games[gameID].ROUNDS.length - 1].RED_TEAM.COMMANDERS
        = removePLayer(sessID, group)


}


// Remove Red Agent Funciton
function removeRedAgent(gameID, sessID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.RED_TEAM == undefined) {
        round.RED_TEAM = []
    }

    if (round.RED_TEAM.AGENTS == undefined) {
        round.RED_TEAM.AGENTS = []
    }

    let group = round.RED_TEAM.AGENTS
    games[gameID].ROUNDS[games[gameID].ROUNDS.length - 1].RED_TEAM.AGENTS
        = removePLayer(sessID, group) 
}




















// Join Spectator
function joinSpectatorData(gameID, sessID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    // Spectators
    let group = round.PLAYER_SPECTATORS
    if (group == undefined) {
        group = []
    }

    if (group.indexOf(sessID) === -1) {
        let player = { SESSION_ID: sessID, USERNAME: games[gameID].PLAYER_DATA[sessID].USERNAME }
        group[sessID] = player
    }

    games[gameID].ROUNDS[games[gameID].ROUNDS.length - 1].PLAYER_SPECTATORS = group

    removeBlueCommander(gameID, sessID)
    removeBlueAgent(gameID, sessID)
    removeRedCommander(gameID, sessID)
    removeRedAgent(gameID, sessID)


}


// Join Blue Commanders
function joinBlueCommanders(gameID, sessID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.BLUE_TEAM == undefined) {
        round.BLUE_TEAM = []
    }

    if (round.BLUE_TEAM.COMMANDERS == undefined) {
        round.BLUE_TEAM.COMMANDERS = []
    }

    let group = round.BLUE_TEAM.COMMANDERS
    if (group == undefined) {
        group = []
    }

    if (group.indexOf(sessID) === -1) {
        let player = { SESSION_ID: sessID, USERNAME: games[gameID].PLAYER_DATA[sessID].USERNAME }
        games[gameID].ROUNDS[game.ROUNDS.length - 1].BLUE_TEAM.COMMANDERS[sessID] = player
    }

    removeSpectator(gameID, sessID)
    removeBlueAgent(gameID, sessID)
    removeRedCommander(gameID, sessID)
    removeRedAgent(gameID, sessID)


}


// Join Blue Agents
function joinBlueAgents(gameID, sessID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.BLUE_TEAM == undefined) {
        round.BLUE_TEAM = []
    }

    if (round.BLUE_TEAM.AGENTS == undefined) {
        round.BLUE_TEAM.AGENTS = []
    }

    let group = round.BLUE_TEAM.AGENTS
    if (group == undefined) {
        group = []
    }

    if (group.indexOf(sessID) === -1) {
        let player = { SESSION_ID: sessID, USERNAME: games[gameID].PLAYER_DATA[sessID].USERNAME }
        games[gameID].ROUNDS[game.ROUNDS.length - 1].BLUE_TEAM.AGENTS[sessID] = player
    }

    removeSpectator(gameID, sessID)
    removeBlueCommander(gameID, sessID)
    removeRedCommander(gameID, sessID)
    removeRedAgent(gameID, sessID)


}


// Join Red Commanders
function joinRedCommanders(gameID, sessID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.RED_TEAM == undefined) {
        round.RED_TEAM = []
    }

    if (round.RED_TEAM.COMMANDERS == undefined) {
        round.RED_TEAM.COMMANDERS = []
    }

    let group = round.RED_TEAM.COMMANDERS
    if (group == undefined) {
        group = []
    }

    if (group.indexOf(sessID) === -1) {
        let player = { SESSION_ID: sessID, USERNAME: games[gameID].PLAYER_DATA[sessID].USERNAME }
        games[gameID].ROUNDS[game.ROUNDS.length - 1].RED_TEAM.COMMANDERS[sessID] = player
    }

    removeSpectator(gameID, sessID)
    removeBlueCommander(gameID, sessID)
    removeBlueAgent(gameID, sessID)
    removeRedAgent(gameID, sessID)


}


// Join Red Agents
function joinRedAgents(gameID, sessID) {
    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    if (round.RED_TEAM == undefined) {
        round.RED_TEAM = []
    }

    if (round.RED_TEAM.AGENTS == undefined) {
        round.RED_TEAM.AGENTS = []
    }

    let group = round.RED_TEAM.AGENTS
    if (group == undefined) {
        group = []
    }

    if (group.indexOf(sessID) === -1) {
        let player = { SESSION_ID: sessID, USERNAME: games[gameID].PLAYER_DATA[sessID].USERNAME }
        games[gameID].ROUNDS[game.ROUNDS.length - 1].RED_TEAM.AGENTS[sessID] = player
    }

    removeSpectator(gameID, sessID)
    removeBlueCommander(gameID, sessID)
    removeBlueAgent(gameID, sessID)
    removeRedCommander(gameID, sessID)

    console.log(round);


}








function emitPlayerData(gameID) {

    let game = games[gameID]
    let round = game.ROUNDS[game.ROUNDS.length - 1]

    let spectators = Object.assign({}, round.PLAYER_SPECTATORS)
    let redAgents = Object.assign({}, round.RED_TEAM.AGENTS)
    let redCommanders = Object.assign({}, round.RED_TEAM.COMMANDERS)
    let blueAgents = Object.assign({}, round.BLUE_TEAM.AGENTS)
    let blueCommanders = Object.assign({}, round.BLUE_TEAM.COMMANDERS)

    let res = {
        PLAYER_SPECTATORS: Object.assign({}, spectators),
        RED_TEAM_AGENTS: Object.assign({}, redAgents),
        RED_TEAM_COMMANDERS: Object.assign({}, redCommanders),
        BLUE_TEAM_AGENTS: Object.assign({}, blueAgents),
        BLUE_TEAM_COMMANDERS: Object.assign({}, blueCommanders),
    }


    io.to(gameID).emit('updatePlayerStatus', res);
}