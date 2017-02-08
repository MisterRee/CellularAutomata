const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');
const port = process.env.PORT || process.env.NODE_PORT || 3000;
const index = fs.readFileSync( ___dirname + '/../client/client.html' );

function onRequest( request, responce ){
  responce.writeHead( 200, {"Content-Type": "text/html"} );
  responce.write( index );
  responce.end();
}

const app = http.createServer( onRequest ).listen( port );
const io = socketio( app );

io.sockets.on( 'connection', function ( socket ){
  console.log( 'server detects connection' );
});

console.log( 'websocket server started' );
