var express = require('express');
var router = express.Router();
var firebaseHelper = require('./firebase.helper');
var sendMessage = firebaseHelper.sendMessage;
var ACTIONS = firebaseHelper.actions;
var Player = require('../models/player');
var Match = require('../models/match');

/**
 * Retrieves the player that is mapped by the specified id
 */
router.get('/id/:id', function (req, res, next) {
    let id = req.params.id;

    Player.findOne({_id: id}, (error, player) => {
        if (error) {
            res.status(500).json({
                error: error
            });
            return;
        }

        res.json(player);
    });
});

/**
 * Retrieves the player that is mapped by the specified id
 */
router.get('/token/:token', function (req, res, next) {
    let token = req.params.token;

    Player.findOne({token: token}, (error, player) => {
        if (error) {
            res.status(500).json({
                error: error
            });
            return;
        }

        res.json(player);
    });
});

/**
 * Retrieves the players that are logged in the server
 */
router.get('/room/:id', function (req, res, next) {
    let id = req.params.id;

    Player.find({ logged: true }).where('_id').ne(id).exec((error, players) => {
        if (error) {
            console.log(error);
            res.status(500).json({
                error: error
            });
            console.log(error);
            return;
        }

        // players.forEach( (player) => {
        //     Match.findOne({ $and: [
        //         { $or:[ { player1: id }, { player2: id } ] },
        //         { playing: true }
        //     ]}, (error, match) => {
        //         if (!error && !match) {
        //             let index = players.indexOf(player);
        //             if (index > -1) {
        //                 player.slice(index);
        //             }
        //         }
        //     });
        // }, this);

        res.json(players);
    });
});

/**
 * Creates the player and set the logged boolean flag to true automatically
 */
router.post('/signin', function (req, res, next) {
    req.body.logged = true;
    Player.findOneAndUpdate({ name: req.body.name }, req.body, { upsert: true, new: true }, (error, player) => {
        if (error) {
            console.log(error);
            res.status(500).json(error);
            return;
        }

        res.status(201).json(player);
    });
});

/**
 * Logs out the specified user
 */
router.put('/logout/:id', function (req, res, next) {
    let id = req.params.id;

    Player.findOneAndUpdate({ _id: id }, { logged: false, token: null }, { upsert: false }, (error, player) => {
        if (error) {
            res.status(500).json(error);
            return;
        }

        res.status(200).json(player);
    });
});

module.exports = router;
