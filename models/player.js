var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    name: {
        type: String,
        required: true
    },
    token: {
        type: String
    },
    logged: {
        type: Boolean,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Player', schema)