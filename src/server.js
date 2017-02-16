const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');
const port = process.env.PORT || process.env.NODE_PORT || 3000;
const index = fs.readFileSync( __dirname + '/../client/client.html' );

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

// Mouse Interactivty variables
const maxColorValueCoefficient = 638; // This fancy variable is the commulative total of rgb values; right now requires to be greater than 255
const colorRollThreshold = 0.2; // Should be number between 0 - 0.5, forces rerolls of extreme colors more frequently the higher this is
const colorDarknessThreshold = 0.1; // Number between 0 - 1, causes very dark colors to brighten to a colored state even when a cell is alive
let mouseEffectSize = 5; // Should be odd number. Acts like a palette size

// Each cell contains an object which contains four variables,
// The living state of the cell, and the three rgb color values of the current frame
let grid = []; // Display
let temp = []; // Editing
let mouselocations = []; // Hold coordinates of each client's mouse
let packet = { rfr: refreshRate,
                 w: width,
                 h: height,
               dnr: darkenRate,
               lnr: lightenRate,
                 g: grid }; // The chunky data packet continuously sent to clients
let users = [];

  // function that generates a unique user ID, if an identical one is rolled, the function is run once again
  let generateUserID = function(){
    let userID = Math.floor( Math.random() * 1000 );
    let test = true;

    for( let u = 0; u < users; u++ ){
      if( users[u].ID === userID ){
        test = false;
      }
    }

    if( test ){
      return userID;
    } else {
      generateUserID();
    }
  };

  // function that needs to only be called once, rolls a random color for the person to use
  let generateMouseColor = function(){
    let mouseColor = { r : 0,
                       g : 0,
                       b : 0 };

    while( true ){
      if( true ){
        // Red generation always gets favored as gets free dice roll from 0 - 255 in any case
        mouseColor.r = Math.floor( Math.random() * 256 );

        // Green generation can potentially be limited in its maximum value by the roll of red
        if( 255 < maxColorValueCoefficient - mouseColor.r ){
          mouseColor.g = Math.floor( Math.random() * 256 );
        } else {
          mouseColor.g = Math.floor( Math.random() * maxColorValueCoefficient - mouseColor.r + 1 );
        }

        // Blue generation can potentially be limited in its maximum value by the roll of red and green
        if( 255 < maxColorValueCoefficient - ( mouseColor.r + mouseColor.g )){
          mouseColor.b = Math.floor( Math.random() * 256 );
        } else {
          mouseColor.b = Math.floor( Math.random() * maxColorValueCoefficient - ( mouseColor.r + mouseColor.g ));
        }
      }

      // Reroll the values if the left over mcvc is too high, leading to a base color that is too bright { or }
      // Reroll the values if the left over mcvc is too low, leading to a base color that is too dark
      if( maxColorValueCoefficient * ( 1 - colorRollThreshold ) >= maxColorValueCoefficient - ( mouseColor.r + mouseColor.g + mouseColor.b ) ||
          maxColorValueCoefficient * colorRollThreshold <= maxColorValueCoefficient - ( mouseColor.r + mouseColor.g + mouseColor.b )){
        return mouseColor;
      } else {
        generateMouseColor();
      }
    }
  };

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

    console.log( 'websocket server started' );
    setInterval( getInput.bind( null, runAutomata.bind( null, colorCheck.bind( null, emitData ) ) ), refreshRate );
  };

  // Retrieve data from clients before running calculations
  let getInput = function( callback ){
     // hand shaking with clients for their current mouse position
     io.sockets.emit( 'requestInput' );
     callback();
  };

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

        // second rule, changed to be the opposite of the game of life. This causes cells to coninuously generate
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

    callback();
  };

  // function after the automata checks that calculate new color values before sending data off to clients
  let colorCheck = function( callback ){
    for( let y = 0; y < height; y++ ){
      for( let x = 0; x < width; x++ ){
        let mouseEffect = false;
        let ue = { n : 0,
                   r : 0,
                   g : 0,
                   b : 0,
                 rdc : 0,
                 gdc : 0,
                 bdc : 0 };
        for( let u = 0; u < users.length; u++){
          if( users[u].y !== -1 && users[u].x !== -1 ){
            const distY = Math.abs( users[u].y - y );
            const distX = Math.abs( users[u].x - x );
            if( distY <= Math.floor( mouseEffectSize / 2 ) &&
                distY + distX < Math.ceil( mouseEffectSize / 2 ) ){
                mouseEffect = true;
                ue.n++;
                ue.r += users[u].color.r;
                ue.g += users[u].color.g;
                ue.b += users[u].color.b;
                ue.rdc += darkenRate * users[u].color.r / 128 / ( distX + distY + 1 );
                ue.gdc += darkenRate * users[u].color.g / 128 / ( distX + distY + 1 );
                ue.bdc += darkenRate * users[u].color.b / 128 / ( distX + distY + 1 );
            }
          }
        }

        if( mouseEffect ){
          temp[ y ][ x ] = variedColorLimiter( temp[ y ][ x ],
                                               Math.floor( ue.r / ue.n ),
                                               Math.floor( ue.g / ue.n ),
                                               Math.floor( ue.b / ue.n ),
                                               Math.floor( ue.rdc / ue.n ),
                                               Math.floor( ue.gdc / ue.n ),
                                               Math.floor( ue.bdc / ue.n ),
                                               lightenRate );
        } else {
          temp[ y ][ x ] = colorLimiter( temp[ y ][ x ], darkenRate, lightenRate );
        }
      }
    }

    grid = temp;
    callback();
  };

  // Helper function that detects changes in color
  // Changes color with a constant pace across all spectrum colors
  let colorLimiter = function( obj, ddr, dlr ){
    if( obj.cs === 1 ){
      if( obj.rcv - ddr < 0 ){
        obj.rcv = 0;
      } else {
        obj.rcv -= ddr;
      }
      if( obj.gcv - ddr < 0 ){
        obj.gcv = 0;
      } else {
        obj.gcv -= ddr;
      }
      if( obj.bcv - ddr < 0 ){
        obj.bcv = 0;
      } else {
        obj.bcv -= ddr;
      }
    } else {
      if( obj.rcv + dlr > 255 ){
        obj.rcv = 255;
      } else {
        obj.rcv += dlr;
      }
      if( obj.gcv + dlr > 255 ){
        obj.gcv = 255;
      } else {
        obj.gcv += dlr;
      }
      if( obj.bcv + dlr > 255 ){
        obj.bcv = 255;
      } else {
        obj.bcv += dlr;
      }
    }
    obj.rcv = Math.floor(obj.rcv);
    obj.gcv = Math.floor(obj.gcv);
    obj.bcv = Math.floor(obj.bcv);
    return obj;
  };

  // Helper function to limit color values between 0 - 255, but with different darkening values and lmits for each color
	// Cells that are called to this color limiter function will 'decay' into the rolled base color.
	let variedColorLimiter = function( obj, mcr, mcg, mcb, rddr, gddr, bddr, dlr ){
		if( obj.cs === 1 ){
			if( Math.abs( obj.rcv - mcr / colorDarknessThreshold ) < ( 255 * colorDarknessThreshold  / 2) ){
				obj.rcv = mcr;
			} else if ( obj.rcv < mcr / colorDarknessThreshold ){
				obj.rcv += dlr;
			} else {
				obj.rcv -= rddr;
			}
			if( Math.abs( obj.gcv - mcg / colorDarknessThreshold ) < ( 255 * colorDarknessThreshold  / 2) ){
				obj.gcv = mcg;
			} else if( obj.gcv < mcg / colorDarknessThreshold ){
				obj.gcv += dlr;
			} else {
				obj.gcv -= gddr;
			}
			if( Math.abs( obj.bcv - mcb / colorDarknessThreshold ) < ( 255 * colorDarknessThreshold / 2) ){
				obj.bcv = mcb;
			} else if( obj.bcv < mcb / colorDarknessThreshold ){
				obj.bcv += dlr;
			} else {
				obj.bcv -= bddr;
			}
		} else {
			if( obj.rcv + dlr > mcr ){
				obj.rcv = mcr;
			} else {
				obj.rcv += dlr;
			}
			if( obj.gcv + dlr > mcg ){
				obj.gcv = mcg;
			} else {
				obj.gcv += dlr;
			}
			if( obj.bcv + dlr > mcb ){
				obj.bcv = mcb;
			} else {
				obj.bcv += dlr;
			}
		}
    obj.rcv = Math.floor(obj.rcv);
    obj.gcv = Math.floor(obj.gcv);
    obj.bcv = Math.floor(obj.bcv);
		return obj;
	};

  // Outputs calculated grid data to clients after all calculations
  let emitData = function(){
    io.sockets.emit( 'draw', packet );
  };

  // Called when client connects to the socket
  io.sockets.on( 'connection', function( socket ){
    socket.emit( 'clientSetup', packet );

    socket.on( 'onconnection', function(){
      let userID = generateUserID();
      socket.ID = userID;
      users.push( { ID : userID,
                 color : generateMouseColor(),
                     x : -1,
                     y : -1 } );
    });

    // Called every refresh frame to get the socket users' mouse coordinates
    socket.on( 'sendInput', function( data ){
      for( let u = 0; u < users.length; u++ ){
        if( socket.ID === users[u].ID ){
          users[u].x = data.x;
          users[u].y = data.y;
          break;
        }
      }
    });

    // Called when a user clicks to reroll their mouse color values associated to their socket
    socket.on( 'changeColor', function(){
      for( let u = 0; u < users.length; u++ ){
        if( socket.ID === users[u].ID ){
          users[u].color = generateMouseColor();
          break;
        }
      }
    });

    // Removes user from array if disconnected
    socket.on( 'disconnect', function (){
      for( let u = 0; u < users.length; u++ ){
        if( socket.ID === users[u].ID ){
          users.splice(u, 1);
          break;
        }
      }
    });
  });

  init();
