var express = require('express');
var router = express.Router();
var Match = require('../models/match');
var Player = require('../models/player');
var firebaseHelper = require('./firebase.helper');
var sendMessage = firebaseHelper.sendMessage;
var ACTIONS = firebaseHelper.actions;

/**
 * Retrieves the match that is mapped by the specified id
 */
router.get('/id/:id', function (req, res, next) {
    let id = req.params.id;

    Match.findById(id, (error, match) => {
        if (error) {
            res.status(500).json({
                error: error
            });
            return;
        }

        res.json(match);
    });
});

/**
 * Retrieves the match that a specific player is playing
 */
router.get('/player/playing/:playerId', function (req, res, next) {
    let playerId = req.params.playerId;

    Match.find({ $and: [
        { $or:[ { player1: playerId }, { player2: playerId } ] },
        { playing: true }
    ]}, (error, match) => {
        if (error) {
            res.status(500).json({
                error: error
            });
            return;
        }

        res.json(match);
    });
});

/**
 * Retrieves the matchs that a specific player already played
 */
router.get('/player/history/:playerId', function (req, res, next) {
    let playerId = req.params.playerId;

    Match.find({ $and: [
        { $or:[ { player1: playerId }, { player2: playerId } ] },
        { playing: false }
    ]}, (error, matches) => {
        if (error) {
            res.status(500).json({
                error: error
            });
            return;
        }

        res.json(matches);
    });
});

/**
 * Creates the match with the player 1, player 2 and playing boolean set to FALSE. The playing boolean will be set to TRUE when the player 2 accept the match
 */
router.post('/challenge', function (req, res, next) {
    let match = new Match(req.body);
    let player2 = req.body.player2;

    Match.findOne({ $and: [
        { $or:[ { player1: player2 }, { player2: player2 } ] },
        { playing: true }
    ]}, (error, match) => {
        if (!error && match) {
            res.json(null);
            return;
        }

        let newMatch = new Match(req.body);

        newMatch.save((error, match) => {
            if (error) {
                res.status(500).json(error);
                return;
            }

            Player.findById(match.player2, (error, player) => {
                if (error) {
                    res.status(500).json(error);
                    return;
                }


                sendMessage([ player.token ], {
                    action: ACTIONS.CHALLENGE_PLAYER,
                    notification: "true",
                    data: JSON.stringify(match)
                }, (error) => {
                    if (error) {
                        console.log(error);
                        res.status(500).json({
                            error: error
                        });
                        return;
                    }

                    res.status(201).json(match);
                });
            });
        });
    });
});

/**
 * Updates de playing boolean property to TRUE and notifies the player 1 that the match can begin
 */
router.put('/accept/:id', function (req, res, next) {
    let id = req.params.id;

    Match.findOneAndUpdate({ _id: id }, { playing: true }, { upsert: false }, (error, match) => {
        if (error) {
            res.status(500).json(error);
            return;
        }

        Player.findById(match.player1, (error, player) => {
            if (error) {
                res.status(500).json(error);
                return;
            }

            sendMessage([ player.token ], {
                action: ACTIONS.ACCEPT_MATCH_REQUEST,
                notification: "false",
                data: JSON.stringify(match)
            }, (error) => {
                if (error) {
                    res.status(500).json({
                        error: error
                    });
                    return;
                }

                res.status(201).json(match);
            });
        });
    });
});

/**
 * Removes the match that the player 2 declined and notifies the player 1 that the match was cancelled
 */
router.delete('/decline/:id', function (req, res, next) {
    let id = req.params.id;

    Match.findById(id, (error, match) => {
        if (error) {
            res.status(500).json(error);
            return;
        }

        Player.findById(match.player1, (error, player) => {
            if (error) {
                res.status(500).json(error);
                return;
            }

            sendMessage([ player.token ], {
                action: ACTIONS.DECLINE_MATCH_REQUEST,
                notification: "false",
                data: JSON.stringify(match)
            }, (error) => {
                if (error) {
                    res.status(500).json({
                        error: error
                    });
                    return;
                }

                Match.remove({ _id: id }, (error) => {
                    if (error) {
                        res.status(500).json(error);
                        return;
                    }

                    res.status(200).json({
                        http_code: 200
                    });
                });
            });
        });
    });
});

/**
 * Updates the player move depending on the player that made the request. If the player that made the request was the last one then calculate the game result and determine which player is the winner and noties him
 */
router.put('/move/:matchId/:playerId/:move', function (req, res, next) {
    let matchId = req.params.matchId;
    let playerId = req.params.playerId;
    let move = req.params.move;

    Match.findById(matchId, (error, match) => {
        if (error) {
            console.log(error);
            res.status(500).json(error);
            return;
        }

        if (match.player1 == playerId) {
            match.player1_move = move;
         } else if (match.player2 == playerId) {
            match.player2_move = move;
        }

        // if both moves were set, then calculate the game result and update the winner property
        if (match.player1_move != 'NONE' && match.player2_move != 'NONE') {
            switch(match.player1_move) {
                case 'PAPER':
                switch(match.player2_move) {
                    case 'PAPER':
                    break;
                    case 'ROCK':
                    match.winner = match.player1;
                    break;
                    case 'SCISSORS':
                    match.winner = match.player2;
                    break;
                }
                break;
                case 'ROCK':
                switch(match.player2_move) {
                    case 'PAPER':
                    match.winner = match.player2;
                    break;
                    case 'ROCK':
                    break;
                    case 'SCISSORS':
                    match.winner = match.player1;
                    break;
                }
                break;
                case 'SCISSORS':
                switch(match.player2_move) {
                    case 'PAPER':
                    match.winner = match.player1;
                    break;
                    case 'ROCK':
                    match.winner = match.player2;
                    break;
                    case 'SCISSORS':
                    break;
                }
                break;
            }

            match.playing = false;
        }

        match.save((error, match) => {
            if (error) {
                console.log(error);
                res.status(500).json(error);
                return;
            }

            if (!match.playing) {
                Player.find({ $or: [ { _id: match.player1 }, { _id: match.player2 } ] }, (error, players) => {
                    if (error) {
                        console.log(error);
                        res.status(500).json(error);
                        return;
                    }

                    let tokens = [];

                    players.forEach(function(player) {
                        tokens.push(player.token);
                    }, this);

                    sendMessage(tokens, {
                        action: ACTIONS.MATCH_END,
                        notification: "false",
                        data: JSON.stringify(match)
                    }, (error) => {
                        if (error) {
                            console.log(error);
                            res.status(500).json({
                                error: error
                            });
                            return;
                        }

                        res.status(201).json(match);
                    });
                });
            }
        });
    });
});

/**
 * Updates the specified match with the winner by rage quit. The user that makes this request is the rage quitter and will loose the match consequently
 */
router.put('/ragequit/:matchId/:playerId', function (req, res, next) {
    let matchId = req.params.matchId;
    let playerId = req.params.playerId;

    Match.findById(matchId, (error, match) => {
        if (error) {
            res.status(500).json(error);
            return;
        }

        match.winner = (match.player1 == playerId) ? match.player2 : match.player1;
        match.playing = false;

        match.save((error, match) => {
            if (error) {
                res.status(500).json(error);
                return;
            }

            Player.findById(match.winner, (error, player) => {
                if (error) {
                    res.status(500).json(error);
                    return;
                }

                sendMessage([ player.token ], {
                    action: ACTIONS.MATCH_CANCELED,
                    notification: "false",
                    data: JSON.stringify(match)
                }, (error) => {
                    if (error) {
                        res.status(500).json({
                            error: error
                        });
                        return;
                    }

                    res.status(201).json(match);
                });
            });
        });
    });
});

router.post('/taunt/:matchId/:playerId/:taunt', (req, res, next) => {
    let matchId = req.params.matchId;
    let playerId = req.params.playerId;
    let taunt = req.params.taunt;

    Match.findById(matchId, (error, match) => {
        if (error) {
            console.log('Error: ' + error);
            res.status(500).json(error);
            return;
        }

        let oponentId = (match.player1 == playerId) ? match.player2 : match.player1;

        Player.findById(oponentId, (error, player) => {
            if (error) {
                res.status(500).json(error);
                return;
            }

            let tauntJSON = {taunt: taunt}

            sendMessage([ player.token ], {
                action: ACTIONS.TAUNT,
                notification: "false",
                data: JSON.stringify(tauntJSON)
            }, (error) => {
                if (error) {
                    console.log('Error: ' + error);
                    res.status(500).json({
                        error: error
                    });
                    return;
                }

                res.status(201).json(match);
            });
        });
    });
});

module.exports = router;
