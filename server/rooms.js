const crypto = require("crypto");
const { initialState, serialize } = require("./chessEngine");
const rooms = new Map();

function code() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s;
  do {
    s = Array.from({ length: 6 }, () => chars[crypto.randomInt(chars.length)]).join("");
  } while (rooms.has(s));
  return s;
}

function create(time = 3) {
  time = Math.max(1, Math.min(5, Number(time) || 3));
  const r = {
    code: code(),
    players: {
      w: { id: null, token: crypto.randomBytes(24).toString("hex"), name: "Blancs" },
      b: { id: null, token: crypto.randomBytes(24).toString("hex"), name: "Noirs" }
    },
    state: initialState(),
    time,
    clocks: { w: time * 60000, b: time * 60000 },
    last: Date.now(),
    disc: { w: null, b: null }
  };
  rooms.set(r.code, r);
  return r;
}

function get(c) {
  return rooms.get(String(c || "").toUpperCase());
}

function join(r, id, token, name) {
  name = String(name || "Joueur").trim().slice(0, 15) || "Joueur";

  // 1. Reconnexion : uniquement si le token correspond ET que le joueur était déconnecté ou réutilise sa socket
  if (token) {
    for (const c of ["w", "b"]) {
      if (r.players[c].token === token) {
        if (r.players[c].id === null || r.players[c].id === id) {
          r.players[c].id = id;
          r.players[c].name = name;
          r.disc[c] = null;
          return { color: c, token: r.players[c].token, reconnected: true };
        }
      }
    }
  }

  // 2. Attribution de place pour un nouveau joueur
  if (!r.players.w.id) {
    r.players.w.id = id;
    r.players.w.name = name;
    return { color: "w", token: r.players.w.token, reconnected: false };
  }

  if (!r.players.b.id) {
    r.players.b.id = id;
    r.players.b.name = name;
    return { color: "b", token: r.players.b.token, reconnected: false };
  }

  return null;
}

function color(r, id) {
  return r.players.w.id === id ? "w" : r.players.b.id === id ? "b" : null;
}

function tick(r) {
  if (r.state.status !== "playing") {
    r.last = Date.now();
    return false;
  }
  const now = Date.now(), dt = Math.max(0, now - r.last);
  r.last = now;
  r.clocks[r.state.turn] -= dt;
  if (r.clocks[r.state.turn] <= 0) {
    r.clocks[r.state.turn] = 0;
    r.state.status = "timeout";
    r.state.winner = r.state.turn === "w" ? "b" : "w";
    r.state.reason = "temps_ecoule";
    return true;
  }
  return false;
}

function snap(r) {
  return {
    code: r.code,
    players: {
      w: { name: r.players.w.name, connected: !!r.players.w.id },
      b: { name: r.players.b.name, connected: !!r.players.b.id }
    },
    time: r.time,
    clocks: r.clocks,
    state: serialize(r.state)
  };
}

function disconnect(r, c) {
  if (c) {
    r.players[c].id = null;
    r.disc[c] = Date.now();
  }
}

function cleanup() {
  const now = Date.now();
  for (const [r, c] of rooms) {
    if (!c.players.w.id && !c.players.b.id && now - Math.max(c.disc.w || 0, c.disc.b || 0) > 1800000) {
      rooms.delete(r);
    }
  }
}

setInterval(cleanup, 300000).unref();

module.exports = { create, get, join, color, tick, snap, disconnect };