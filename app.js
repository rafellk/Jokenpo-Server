var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// connects to the mongoose database
var mongoose = require('mongoose');

// Connect to mongo via mongoose
mongoose.connect('localhost:27017/jokenpo');
var conn = mongoose.connection;

conn.on('error', console.error.bind(console, 'connection error:'));
conn.once('open', function() {
	console.log("Connected to database");
});

mongoose.Promise = require('bluebird');

var playerRoutes = require('./routes/player');
var matchRoutes = require('./routes/match');

var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/player', playerRoutes);
app.use('/match', matchRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({error: "Internal Server Error"});
});

module.exports = app;
