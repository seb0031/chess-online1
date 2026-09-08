const path = require("path"), http = require("http"), express = require("express");
const { Server } = require("socket.io"), rooms = require("./rooms"), chess = require("./chessEngine");
const app = express(), server = http.createServer(app), io = new Server(server, { cors: { origin: "*" } });
const PORT = Number(process.env.PORT) || 3000, active = new Set();

app.use(express.static(path.join(__dirname, "..", "public")));
app.get("/health", (q, res) => res.json({ ok: true }));

function emit(r) { io.to(r.code).emit("state", rooms.snap(r)); }

io.on("connection", s => {
  s.on("create", p => {
    const r = rooms.create(p?.time), j = rooms.join(r, s.id, null, p?.name);
    active.add(r);
    s.join(r.code);
    s.data = { room: r.code, color: j.color, token: j.token };
    s.emit("roomCreated", { code: r.code, color: j.color, token: j.token, snapshot: rooms.snap(r) });
    emit(r);
  });

  s.on("join", p => {
    const r = rooms.get(p?.code);
    if (!r) return s.emit("errorMessage", "Partie introuvable.");
    const j = rooms.join(r, s.id, p?.token, p?.name);
    if (!j) return s.emit("errorMessage", "Cette partie est déjà complète.");
    active.add(r);
    s.join(r.code);
    s.data = { room: r.code, color: j.color, token: j.token };
    s.emit("joined", { code: r.code, color: j.color, token: j.token, snapshot: rooms.snap(r) });
    emit(r);
  });

  s.on("move", p => {
    const r = rooms.get(s.data.room);
    if (!r) return;
    const c = rooms.color(r, s.id);
    if (!c) return;
    if (r.state.turn !== c) return s.emit("moveRejected", "not_your_turn");
    rooms.tick(r);
    if (r.state.status !== "playing") return emit(r);
    const z = chess.makeMove(r.state, String(p?.from || ""), String(p?.to || ""), p?.promotion);
    if (!z.ok) return s.emit("moveRejected", z.error);
    r.state = z.state;
    r.last = Date.now();
    emit(r);
    io.to(r.code).emit("moveAccepted", z.move);
  });

  s.on("requestState", () => {
    const r = rooms.get(s.data.room);
    if (r) {
      rooms.tick(r);
      s.emit("state", rooms.snap(r));
    }
  });

  s.on("disconnect", () => {
    const r = rooms.get(s.data.room);
    if (!r) return;
    rooms.disconnect(r, rooms.color(r, s.id));
    emit(r);
  });
});

setInterval(() => {
  for (const r of active) {
    if (!rooms.get(r.code)) {
      active.delete(r);
      continue;
    }
    if (rooms.tick(r)) emit(r);
    else if (r.players.w.id || r.players.b.id) io.to(r.code).emit("clock", r.clocks);
  }
}, 250);

server.listen(PORT, "0.0.0.0", () => console.log(`Chess Online : http://localhost:${PORT}`));