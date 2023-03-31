const socket = io('/');

let turn = 'X';
let notturn = 'O';
let mark = null;

start = false

board = [
   ['', '', ''],
   ['', '', ''],
   ['', '', '']
];

socket.on('connect', () => {
   socket.emit('join-room', ROOM_ID);
   displayUpdate('Tic Tac Toe')
});

socket.on('room-exists', (roomName) => { //does not exist
   const updateBox = document.getElementById('update-box');
   updateBox.textContent = 'You are not creative. Room'+roomName+' already exists.';
});

socket.on('room-created', (roomName) => { //does not exist
   const updateBox = document.getElementById('update-box');
   updateBox.textContent = 'A tic-tac-toe dynasty is created at '+roomName;
});

socket.on('room-full', () => { //does not exist
   // handle room full error
});

socket.on('assign-mark', (m) => {
   mark = m;
   if (mark==='W') {
      return
   }
   else {
      const cells = document.querySelectorAll('.cell');
      for (let i = 0; i < cells.length; i++) {
         cells[i].setAttribute('hovermark', mark);
         if (mark===turn) { 
            cells[i].style.setProperty('--hover-color', 'black');
         }
         else if (mark===notturn) { 
            cells[i].style.setProperty('--hover-color', 'red'); 
         }
      }
   }
});

socket.on('user-connected', (xo) => {
   // handle new user connection
   displayUpdate('A challenger approaches!');
});

socket.on('user-disconnected', (xo) => {
   // handle user disconnection
   displayUpdate('Your opponent rage quit! Victory by submission!');
   start = false
   board = [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
   ];
   document.getElementById("play-again").disabled = false;
});

socket.on('start-game', () => { //might not even need this. but good to have
   start = true
   turn = 'X'
   notturn = 'O'
   if (mark !== 'W') {
      const cells = document.querySelectorAll('.cell');
      for (let i = 0; i < cells.length; i++) {
         cells[i].innerText = '';
         cells[i].setAttribute('hovermark', mark);
         if (mark===turn) { 
            cells[i].style.setProperty('--hover-color', 'black');
         }
         else if (mark===notturn) { 
            cells[i].style.setProperty('--hover-color', 'red'); 
         }
      }
      document.getElementById("play-again").disabled = true;
   }
});

socket.on('wait-for-start', () => {
   displayUpdate('Wait for the game to start!');
});
socket.on('wait-your-turn', () => {
   displayUpdate('Wait your turn');
});

socket.on('cell-clicked', (row, col, xo) => { //GAME LOGIC GOES HERE
   displayClick(row, col, xo);
   board[row][col] = xo;
   //console.log(board)
   switchTurn();
   displayUpdate('Tic Tac Toe')
   win = checkWin()
   if (win !== null) {
      //socket.emit('game-over', win);
      displayUpdate(win+' wins!');
      start = false
      board = [
         ['', '', ''],
         ['', '', ''],
         ['', '', '']
      ];
      const cells = document.querySelectorAll('.cell');
      for (let i = 0; i < cells.length; i++) {
         cells[i].setAttribute('hovermark', '');
         cells[i].style.setProperty('--hover-color', 'red');
      }
      document.getElementById("play-again").disabled = false;
   }
});

function handleCellClick(row, col) {
   if (mark==='W') {
      return;
   }
   else {
      //console.log(start)
      //console.log(turn)
      //console.log(mark)
      if(board[row][col]==='') {
         if (start===true) {
            if (turn===mark) {
               socket.emit('cell-clicked', row, col, mark);
            }
            else { displayUpdate('Wait your turn'); }
         }
         else { displayUpdate('Wait for the game to start!'); }
      }
   }
}

function switchTurn() {
   temp = turn
   turn = notturn
   notturn = temp
   //console.log(turn+' '+notturn)
   const cells = document.querySelectorAll('.cell');
   for (let i = 0; i < cells.length; i++) {
      if (mark===turn) { 
         cells[i].style.setProperty('--hover-color', 'black');
      }
      else if (mark===notturn) { 
         cells[i].style.setProperty('--hover-color', 'red'); 
      }
   }
}

function checkWin() {
   for (let i = 0; i < 3; i++) {
      // Check rows
      if (board[i][0] !== '' && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
         return board[i][0];
      }
      // Check columns
      if (board[0][i] !== '' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
         return board[0][i];
      }
   }
   // Check diagonals
   if (board[0][0] !== '' && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      return board[1][1];
   }
   if (board[0][2] !== '' && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
      return board[1][1];
   }
   return null;
}

function displayClick(row, col, xo) {
   const cell = document.getElementById(`cell-${row}-${col}`);
   cell.innerText = xo;
   cell.setAttribute('hovermark', '');
}

function displayUpdate(str) {
   const updateBox = document.getElementById('update-box');
   updateBox.textContent = str;
}

function handlePlayAgain(){
   if(mark !== 'W') {
      const cells = document.querySelectorAll('.cell');
      for (let i = 0; i < cells.length; i++) {
         cells[i].innerText = '';
         cells[i].setAttribute('hovermark', mark);
         cells[i].style.setProperty('--hover-color', 'red');
      }
      displayUpdate('Tic Tac Toe')
      socket.emit('play-again')
   }
}
