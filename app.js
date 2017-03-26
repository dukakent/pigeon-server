var path = require('path');
var express = require('express');
var app = express();
var debug = require('debug')('nodejs-regular-webapp2:server');
var http = require('http');
var logger = require('morgan');
var bodyParser = require('body-parser');
var dotenv = require('dotenv');
var mongoose = require('mongoose');
var socketioJwt = require('socketio-jwt');
var ws = require('./ws');
var server = http.createServer(app);
var io = require('socket.io')(server);

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

dotenv.load();

mongoose.createConnection('mongodb://duka:1234@ds137550.mlab.com:37550/pigeon');
// mongoose.connect('mongodb://localhost/pigeon');

var authGuard = require('./authGuard');
var userRoutes = require('./routes/user');
var partnerRoutes = require('./routes/partner');
var roomRoutes = require('./routes/room');
var inviteRoutes = require('./routes/invite');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('./public'));

app.use('/api/user', authGuard, userRoutes);
app.use('/api/partner', authGuard, partnerRoutes);
app.use('/api/room', authGuard, roomRoutes);
app.use('/api/invite', authGuard, inviteRoutes);

app.use(function (req, res) {
  var indexPath = path.resolve( './public/index.html');
  res.sendFile(indexPath);
});

io.sockets.on('connection', socketioJwt.authorize({
  secret: process.env.AUTH0_CLIENT_SECRET,
  timeout: 15000
}));

ws.init(io);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send();
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send();
});

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log('Listening on ' + bind);
}
