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

// Behavioral variables
const refreshRate = 75; // How quickly the page refreshes in milliseconds
const width = 25; // How many grids there are in the x-axis
const height = 25; // How many grids there are in the y-axis
const darkenRate = 16.4; // How quickyly 'live' cells darken grids that are alive
const lightenRate = 12.8; // How quickly 'dead' cells lighten grids that are dead

let grid = []; // Display
let temp = []; // Editing
let packet = { rfr: refreshRate,
               w: width,
               h: height,
               dnr: darkenRate,
               lnr: lightenRate,
               g: grid }; // The chunky data packet continuously sent to clients

let init = function(){
  // Initially populating cells
  for( let y = 0; y < height; y++ ){
    grid[ y ] = [];

    for( let x = 0; x < width; x++ ){
      grid[ y ][ x ] = { cs : Math.round( Math.random() ),
                         rcv : 255,
                         gcv : 255,
                         bcv : 255 };
    }
  }

  let swap = grid;
  temp = swap;

  setInterval( runAutomata( emitData ), refreshRate );
}

// Neighbor scanning function that is continuously called
let runAutomata = function( callback ){
  let swap = grid;
  grid = temp;
  temp = swap;

  for( let y = 0; y < height; y++ ){
    for( let x = 0; x < width; x++){
      let cnc = 0;

      for( let i = 0; i < 9; i++ ){
        /*
          Checking neighbors through a loop through the neighbors.
          Index 4 is the coordinates of the cell in question of the check
          [ 0 ][ 1 ][ 2 ]
          [ 3 ][ x ][ 5 ]
          [ 6 ][ 7 ][ 8 ]
        */

        // Skipping out of bound scans
        if( y - 1 < 0 && i < 3 ){
          continue;
        } else if( y + 1 >= height && i > 5 ){
          continue;
        } else if( x - 1 < 0 && i % 3 === 0 ){
          continue;
        } else if( x + 1 >= width && ( i - 2 ) % 3 === 0 ){
          continue;
        }

        switch(i){
          // Neighbors above
          case 0:
          case 1:
          case 2:
            if( grid[ y - 1 ][ x + i - 1 ].cs === 1 ){
              cnc++;
            }
            break;
          // Neighbor to the left
          case 3:
            if( grid[ y ][ x - 1 ].cs === 1 ){
             cnc++;
            }
            break;
          case 4:
            break;
          // Neighbor to the right
          case 5:
            if( grid[ y ][ x + 1 ].cs === 1 ){
             cnc++;
            }
            break;
          // Neighbors below
          case 6:
          case 7:
          case 8:
            if( grid[ y + 1 ][ x + i - 7 ].cs === 1 ){
              cnc++;
            }
            break;
          default:
            break;
        }
      }

      // first rule
      if( cnc < 2 && grid[ y ][ x ].cs === 1 ){
        temp[ y ][ x ].cs = 0;
      }

      // second rule
      if( cnc < 1 && cnc > 4 && grid[ y ][ x ].cs === 1 ){
        temp[ y ][ x ].cs = 0;
      }

      // third rule
      if( cnc > 3 && grid[ y ][ x ].cs === 1 ){
        temp[ y ][ x ].cs = 0;
      }

      // fourth rule
      if( cnc == 3 && grid[ y ][ x ].cs === 0){
        temp[ y ][ x ].cs = 1;
      }
    }
  }
  let swap = temp;
  grid = swap;
  packet.g = swap;
  callback();
}

// Outputs calculated grid data to clients
let emitData = function(){
  io.sockets.emit( 'draw', packet );
}

io.sockets.on( 'connection', function ( socket ){
  console.log( 'server detects connection' );
});

console.log( 'websocket server started' );
init();
