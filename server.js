const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
app.use(express.static("public"));
app.get("/health", (_req, res) => res.json({ ok: true }));

const rooms = new Map();
const CATEGORIES = [
  "ones","twos","threes","fours","fives","sixes",
  "three","four","full","small","large","five","chance"
];
const LABELS = {
  ones:"Einser", twos:"Zweier", threes:"Dreier", fours:"Vierer",
  fives:"Fünfer", sixes:"Sechser", three:"Dreierpasch",
  four:"Viererpasch", full:"Full House", small:"Kleine Straße",
  large:"Große Straße", five:"Kniffel", chance:"Chance"
};
const newId = () => crypto.randomBytes(4).toString("hex").toUpperCase();
const rollDie = () => crypto.randomInt(1, 7);
const sum = dice => dice.reduce((a,b)=>a+b,0);

function score(category, dice) {
  if (!CATEGORIES.includes(category) || dice.length !== 5 || dice.some(n => !Number.isInteger(n) || n < 1 || n > 6)) return null;
  const counts = Array(7).fill(0);
  dice.forEach(n => counts[n]++);
  const total = sum(dice);
  const upper = {ones:1,twos:2,threes:3,fours:4,fives:5,sixes:6};
  if (upper[category]) return counts[upper[category]] * upper[category];
  if (category === "three") return counts.some(n=>n>=3) ? total : 0;
  if (category === "four") return counts.some(n=>n>=4) ? total : 0;
  if (category === "full") return counts.includes(3) && counts.includes(2) ? 25 : 0;
  const unique = new Set(dice);
  if (category === "small") {
    const s = [...unique].join("");
    return ["1234","2345","3456"].some(run=>[...run].every(ch=>s.includes(ch))) ? 30 : 0;
  }
  if (category === "large") {
    return (unique.size === 5 && (dice.every(n=>n>=1&&n<=5) || dice.every(n=>n>=2&&n<=6))) ? 40 : 0;
  }
  if (category === "five") return counts.includes(5) ? 50 : 0;
  if (category === "chance") return total;
  return null;
}
function publicRoom(room) {
  const players = room.players.map((p, i) => ({
    id:p.id, name:p.name, host:p.id===room.hostId,
    scores:p.scores, total:Object.values(p.scores).reduce((a,b)=>a+b,0) +
      (["ones","twos","threes","fours","fives","sixes"].reduce((a,k)=>a+(p.scores[k]||0),0)>=63?35:0),
    done:CATEGORIES.every(k=>p.scores[k] !== undefined)
  }));
  return {
    code:room.code, status:room.status, players, currentPlayerId:room.players[room.turnIndex]?.id || null,
    turn:room.turnIndex+1, dice:room.dice, held:room.held, rollsLeft:room.rollsLeft,
    scoresLabels:LABELS, categories:CATEGORIES.map(id=>({id,name:LABELS[id]})),
    winner:room.winner || null, maxPlayers:6
  };
}
function emitRoom(room) { io.to(room.code).emit("state", publicRoom(room)); }
function error(socket, message) { socket.emit("notice", { message }); }
function getPlayer(socket, room) { return room.players.find(p=>p.id===socket.id); }
function isCurrent(socket, room) { return room.players[room.turnIndex]?.id === socket.id; }
function beginTurn(room) {
  room.dice = [0,0,0,0,0];
  room.held = [false,false,false,false,false];
  room.rollsLeft = 3;
}
function nextTurn(room) {
  if (room.players.every(p=>CATEGORIES.every(k=>p.scores[k]!==undefined))) {
    room.status = "finished";
    room.winner = [...room.players].sort((a,b)=>finalTotal(b)-finalTotal(a))[0]?.id || null;
    return;
  }
  let tries=0;
  do { room.turnIndex=(room.turnIndex+1)%room.players.length; tries++; }
  while (tries <= room.players.length && CATEGORIES.every(k=>room.players[room.turnIndex].scores[k]!==undefined));
  beginTurn(room);
}
function finalTotal(p) {
  const upper=["ones","twos","threes","fours","fives","sixes"].reduce((a,k)=>a+(p.scores[k]||0),0);
  return Object.values(p.scores).reduce((a,b)=>a+b,0)+(upper>=63?35:0);
}
io.on("connection", socket => {
  socket.on("createRoom", ({name}) => {
    name = cleanName(name);
    if (!name) return error(socket,"Bitte gib einen Namen ein.");
    let code; do { code=newId().slice(0,6); } while (rooms.has(code));
    const room={code,hostId:socket.id,players:[{id:socket.id,name,scores:{}}],
      status:"lobby",turnIndex:0,dice:[0,0,0,0,0],held:[false,false,false,false,false],rollsLeft:3};
    rooms.set(code,room); socket.join(code); socket.data.room=code; emitRoom(room);
  });
  socket.on("joinRoom", ({name,code}) => {
    name=cleanName(name); code=String(code||"").trim().toUpperCase();
    const room=rooms.get(code);
    if (!name) return error(socket,"Bitte gib einen Namen ein.");
    if (!room) return error(socket,"Raum nicht gefunden. Prüfe den Code.");
    if (room.status!=="lobby") return error(socket,"Dieses Spiel läuft bereits.");
    if (room.players.length>=6) return error(socket,"Der Raum ist voll (maximal 6 Spieler).");
    if (room.players.some(p=>p.name.toLowerCase()===name.toLowerCase())) return error(socket,"Dieser Name wird bereits verwendet.");
    room.players.push({id:socket.id,name,scores:{}});
    socket.join(code); socket.data.room=code; emitRoom(room);
  });
  socket.on("startGame", () => {
    const room=rooms.get(socket.data.room); if (!room) return;
    if (socket.id!==room.hostId) return error(socket,"Nur der Gastgeber kann das Spiel starten.");
    if (room.status!=="lobby") return;
    if (room.players.length<2) return error(socket,"Mindestens 2 Spieler werden benötigt.");
    room.status="playing"; room.turnIndex=0; beginTurn(room); emitRoom(room);
  });
  socket.on("roll", () => {
    const room=rooms.get(socket.data.room); if (!room || room.status!=="playing") return;
    if (!isCurrent(socket,room)) return error(socket,"Warte, bis du an der Reihe bist.");
    if (room.rollsLeft<=0) return error(socket,"Keine Würfe mehr. Wähle eine Wertung.");
    room.dice=room.dice.map((v,i)=>room.rollsLeft===3||!room.held[i]?rollDie():v);
    room.rollsLeft--; emitRoom(room);
  });
  socket.on("toggleHold", ({index}) => {
    const room=rooms.get(socket.data.room); if (!room || room.status!=="playing") return;
    if (!isCurrent(socket,room)) return error(socket,"Du bist gerade nicht an der Reihe.");
    if (room.rollsLeft===3 || room.rollsLeft===0) return error(socket,"Behalten kannst du Würfel zwischen den Würfen.");
    if (!Number.isInteger(index)||index<0||index>4||room.dice[index]===0) return;
    room.held[index]=!room.held[index]; emitRoom(room);
  });
  socket.on("score", ({category}) => {
    const room=rooms.get(socket.data.room); if (!room || room.status!=="playing") return;
    if (!isCurrent(socket,room)) return error(socket,"Du bist gerade nicht an der Reihe.");
    if (room.rollsLeft===3 || room.dice.some(n=>n===0)) return error(socket,"Würfle zuerst mindestens einmal.");
    const player=getPlayer(socket,room);
    if (!player || !CATEGORIES.includes(category) || player.scores[category]!==undefined) return error(socket,"Diese Kategorie ist nicht verfügbar.");
    player.scores[category]=score(category,room.dice);
    nextTurn(room); emitRoom(room);
  });
  socket.on("disconnect", () => {
    const code=socket.data.room, room=rooms.get(code); if (!room) return;
    const index=room.players.findIndex(p=>p.id===socket.id);
    if (index<0) return;
    const wasCurrent=index===room.turnIndex;
    room.players.splice(index,1);
    if (!room.players.length) { rooms.delete(code); return; }
    if (room.hostId===socket.id) room.hostId=room.players[0].id;
    if (index<room.turnIndex) room.turnIndex--;
    else if (wasCurrent && room.status==="playing") room.turnIndex%=room.players.length;
    if (room.status==="playing") beginTurn(room);
    emitRoom(room);
  });
});
function cleanName(value) {
  return String(value||"").trim().replace(/[<>]/g,"").slice(0,18);
}
server.listen(PORT, () => console.log(`Würfelmeister läuft auf Port ${PORT}`));
