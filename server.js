// require deployd
var deployd = require('deployd');

// configure database etc.
var server = deployd({
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.MONGO_HOST,
    port: process.env.MONGO_PORT,
    name: process.env.MONGO_DBNAME,
    credentials: {
      username: process.env.MONGO_USER,
      password: process.env.MONGO_PW
    }
  }
});

// heroku requires these settings for sockets to work
server.sockets.manager.settings.transports = ["xhr-polling"];

// start the server
server.listen();

// debug
server.on('listening', function() {
  console.log("Server is listening on port: " + process.env.PORT);
});

// Deployd requires this
server.on('error', function(err) {
  console.error(err);
  process.nextTick(function() { // Give the server a chance to return an error
    process.exit();
  });
});
