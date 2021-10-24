// ============ Variables ============ //
const WebSocket = require('ws');
const wsServer = new WebSocket.Server({port: 9000});
let clients = []; // All connected users, means their room ids
let allws = []; // All connections
let rooms = []; // Every room data
let passwords = []; // Passwords to the rooms
// =================================== //

// ============ Functions ============ //
function replaceTags(str) { // To prevent XSS
  let res = '';
  for (let i = 0; i < str.length; i++) {
    if (str[i] == '<') res += '&lt;';
    else if (str[i] == '>') res += '&gt;';
    else res += str[i];
  }
  return res;
}
function getAllIndexes(arr, val) {
  let indexes = []
  let i = -1;
  while ((i = arr.indexOf(val, i + 1)) != -1){
    indexes.push(i);
  }
  return indexes;
}
function sendmessage(user, message, ws, ex='') {
  if (allws.indexOf(ws) > -1) {
    let all_room_ws = getAllIndexes(clients, clients[allws.indexOf(ws)]);
    for (let key of all_room_ws) {
      if (ex == '') {
        user = replaceTags(user);
        message = replaceTags(message);
        allws[key].send(`${user}^BREAKER;${message}^BREAKER;font-weight: bold^BREAKER;`);
      }
      else ws.send(ex);
    }
  }
}
// =================================== //

// ============ Check and kick disconnected users ============ //
setInterval(() => {
  for (ws of allws) {
    ws.isAlive = false;
    sendmessage(null, null, ws, 'ping');
  }
  setTimeout(() => {
    allws.forEach((el, i) => {
      if (el.isAlive) return;
      let roomID = clients[i];
      let conn = allws[i];
      conn.terminate();
      allws.splice(i, 1);
      clients.splice(i, 1);
      if (clients.indexOf(roomID) == -1) { // Forget the room id, if no users are connected to it
        let index = rooms.indexOf(roomID);
        rooms.splice(index, 1);
        passwords.splice(index, 1);
      }
      conn = null;
    });
  }, 10000);
}, 40000);
// =========================================================== //

// ============ Listener ============ //
wsServer.on('connection', ws => {
  console.log('New user');
  ws.on('message', message => {
    data = message.toString().split('^BREAKER;');
    if (data[0] == 'open') {
      let room = data[1];
      if (room.length != 6) return;
      if ( isNaN( Number(room) ) ) return;
      let username = data[2];
      if (username.length < 4) return;
      let password = data[3];
      if (password.length != 4) return;
      if ( isNaN( Number(password) ) ) return;
      function good() {
        allws.push(ws);
        clients.push(room);
        ws.isAlive = true;
        sendmessage(null, null, ws, `Server^BREAKER;User <b>${username}</b> joined.^BREAKER;color:blue;font-weight:bold;^BREAKER;font-style:italic;`)
      }
      if (rooms.indexOf(data[1]) == -1) {
        rooms.push(room);
        passwords.push(password);
        good();
      } else {
        if (passwords[rooms.indexOf(room)] == password) {
          good();
        }
      }
    } else if (data[0] == 'send') {
      sendmessage(data[1], data[2], ws);
    } else if (data[0] == 'pong') {
      if (allws.indexOf(ws) > -1) {
        ws.isAlive = true;
      }
    }
  })
})
// ================================== //
