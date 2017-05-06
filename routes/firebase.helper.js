var FCM = require('fcm-node');
var serverKey = require('../server_secret_key.json');
var fcm = new FCM(serverKey);
var Player = require('../models/player');

const ACTIONS = {
    CHALLENGE_PLAYER: "CHALLENGE_PLAYER",
    DECLINE_MATCH_REQUEST: "DECLINE_MATCH_REQUEST",
    ACCEPT_MATCH_REQUEST: "ACCEPT_MATCH_REQUEST",
    PLAYER_MOVE: "PLAYER_MOVE",
    MATCH_END: "MATCH_END",
    MATCH_CANCELED: "MATCH_CANCELED",
    TAUNT: "TAUNT",
}

const TAUNT_ACTIONS = {
    LOOSER: "LOOSER",
    GOOD_LUCK: "GOOD LUCK",
    SMILE: "SMILE",
    CRY: "CRY"
}

/**
 * Method that sends a message to a specified authentication token with a specified message body
 *
 * @param to - A string that represents the recipient's authentication token
 * @param dataJSON - A json that contains customized data information
 * @param callback - A callback function to be executed when the operation ends
 */
var sendMessage = (tokens, dataJSON, callback) => {
    let message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        registration_ids: tokens,
        // collapse_key: 'your_collapse_key',

        // notification: {
        //     title: 'Title of your push notification',
        //     body: 'Body of your push notification'
        // },

        // data: {  //you can send only notification or only data(or include both)
        //     my_key: 'my value',
        //     my_another_key: 'my another value'
        // }

        data: dataJSON,
        // notification: { title: 'Hello', body: 'Multicast', sound : "default", badge: "1" }
    };

    fcm.send(message, (error, response) => {
        if (error) {
            callback(error, null);
            return;
        }

        callback(null, response);
    });
}

module.exports = {
    sendMessage: sendMessage,
    actions: ACTIONS,
    taunt_actions: TAUNT_ACTIONS
};
