const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('public'))

const rooms = new Map();

app.get('/', (req, res) => {
   //res.redirect('/lobby');
   const availableRooms = [];
   for (const [roomId, room] of rooms) {
      availableRooms.push({
         id: roomId,
         numClients: room.clients.size,
      });
   }
   res.render('lobby', { rooms: availableRooms });
});

/*app.get('/lobby', (req, res) => {
   // Get list of rooms
   const availableRooms = [];
   for (const [roomId, room] of rooms) {
      availableRooms.push({
         id: roomId,
         numClients: room.clients.size,
      });
   }
   res.render('lobby', { rooms: availableRooms });
});*/

app.get('/:room', (req, res) => {
   res.render('room', { roomId: req.params.room })
})

//const clientsInRoom = new Map();
start = false;
xready = false;
oready  = false;
turn = ''
board = [
   ['', '', ''],
   ['', '', ''],
   ['', '', '']
];

io.on('connection', socket => {
   socket.on('join-room', (roomId) => {
      room = rooms.get(roomId);
      if (!room) {
         // Create new room if it doesn't exist
         room = { clients: new Set([socket.id]), x: null, o: null };
         rooms.set(roomId, room);
      }
      else {
         room.clients.add(socket.id);
      }

      socket.join(roomId)
      let mark;
      if (room.x === null) {
         mark = 'X';
         room.x = socket.id;
         xready = true;
      } else if (room.o === null) {
         mark = 'O';
         room.o = socket.id;
         oready = true;
      } else {
         mark = 'W';
      }
      socket.emit('assign-mark', mark);
      /*console.log(roomId)
      console.log(room.clients.size)
      console.log(room.x+' '+room.o)
      console.log(socket.id)*/
      if (mark !== 'W') { socket.to(roomId).emit('user-connected', mark) }
      //console.log(rooms)

      if(room.x !== null && room.o !== null && xready===true && oready===true) {
         start = true;
         turn = room.x
         socket.to(roomId).emit('start-game');
         socket.emit('start-game');
      }
      
      socket.on('cell-clicked', (row, col, xo) => { //GAME LOGIC GOES HERE
         if(board[row][col]==='') {
            if(start===true) {
               if (socket.id===turn) {
                  //console.log(xo+' '+row+' '+col)
                  socket.to(roomId).emit('cell-clicked', row, col, xo);
                  socket.emit('cell-clicked', row, col, xo);

                  board[row][col] = xo;
                  //console.log(board)

                  if(turn===room.x) { turn=room.o }
                  else if(turn===room.o) { turn=room.x }

                  //check win
                  for (let i = 0; i < 3; i++) {
                     // Check rows
                     if (board[i][0] !== '' && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
                        start = false;
                        xready = false;
                        oready  = false;
                        turn = ''
                        board = [
                           ['', '', ''],
                           ['', '', ''],
                           ['', '', '']
                        ];
                     }
                     // Check columns
                     if (board[0][i] !== '' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
                        start = false;
                        xready = false;
                        oready  = false;
                        turn = ''
                        board = [
                           ['', '', ''],
                           ['', '', ''],
                           ['', '', '']
                        ];
                     }
                  }
                  // Check diagonals
                  if (board[0][0] !== '' && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
                     start = false;
                     xready = false;
                     oready  = false;
                     turn = ''
                     board = [
                        ['', '', ''],
                        ['', '', ''],
                        ['', '', '']
                     ];
                  }
                  if (board[0][2] !== '' && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
                     start = false;
                     xready = false;
                     oready  = false;
                     turn = ''
                     board = [
                        ['', '', ''],
                        ['', '', ''],
                        ['', '', '']
                     ];
                  }
                  // Check draw
                  isDraw = true
                  for (let i = 0; i < 3; i++) {
                     for (let j = 0; j < 3; j++) {
                        if (board[i][j] === '') {
                           isDraw = false;
                           break;
                        }
                     }
                  }
                  if (isDraw) {
                     start = false;
                     xready = false;
                     oready  = false;
                     turn = ''
                     board = [
                        ['', '', ''],
                        ['', '', ''],
                        ['', '', '']
                     ];
                  }
               }
               else { socket.emit('wait-your-turn') }
            }
            else { socket.emit('wait-for-start') }
         }
      });

      socket.on('play-again', () => {
         if (room.x === socket.id) {
            xready = true
         }
         else if (room.o === socket.id) {
            oready = true
         }
         if(room.x !== null && room.o !== null && xready===true && oready===true) {
            start = true;
            turn = room.x
            /*tempsocket = room.x
            room.x = room.o
            room.o = tempsocket
            socket.to(room.x).emit('assign-mark', 'X');
            socket.to(room.o).emit('assign-mark', 'O');*/
            socket.to(roomId).emit('start-game');
            socket.emit('start-game');
         }
      });

      socket.on('disconnect', () => {
         room.clients.delete(socket.id);
         if (room.x === socket.id) {
            room.x = null
            socket.to(roomId).emit('user-disconnected', 'X')
            start = false
            board = [
               ['', '', ''],
               ['', '', ''],
               ['', '', '']
            ];
         }
         else if (room.o === socket.id) {
            room.o = null
            socket.to(roomId).emit('user-disconnected', 'O')
            start = false
            board = [
               ['', '', ''],
               ['', '', ''],
               ['', '', '']
            ];
         }
         if (room.clients.size === 0) {
            rooms.delete(roomId);
         }
      })
   })

   socket.on('create-room', (roomName) => {
      room = rooms.get(roomName);
      if(!room) {
         const newRoom = { clients: new Set([socket.id]), x: null, o: null };
         rooms.set(roomName, newRoom);
      }
   });
})

server.listen(process.env.PORT || 3000, () => {
   console.log(`Server started. Listening on port ${process.env.PORT || 3000}`);
});
