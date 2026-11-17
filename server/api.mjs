import express from "express";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { newRoom, view, entrySession, sessionKey, joinRoom, operate, fail, day } from "./rooms.mjs";
const keyOf = req => sessionKey(req.body, req.get("authorization"));
export function createApi({
  dataDir = process.env.ROOM_DATA_DIR || ".data",
  persist = true,
} = {}) {
  const app = express(),
    rooms = new Map(),
    file = join(dataDir, "rooms.json");
  if (persist && existsSync(file)) {
    const entries = JSON.parse(readFileSync(file, "utf8"));
    for (const room of entries)
      if (Date.now() - room.updated < day) rooms.set(room.code, room);
  }
  const save = (room) => {
    if (room) {
      room.updated = Date.now();
      room.revision++;
    }
    for (const [code, r] of rooms)
      if (Date.now() - r.updated > day) rooms.delete(code);
    if (persist) {
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(file + ".tmp", JSON.stringify([...rooms.values()]));
      renameSync(file + ".tmp", file);
    }
  };
  app.disable("x-powered-by");
  app.use(express.json({ limit: "4kb" }), (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.get("/status", (_req, res) => res.json({ online: true }));
  app.post("/rooms", (req, res) => {
    const { key, sessionToken } = entrySession(keyOf(req));
    let room = newRoom(req.body || {}, key);
    while (rooms.has(room.code)) room = newRoom(req.body || {}, key);
    rooms.set(room.code, room);
    save(room);
    res.status(201).json({ ...view(room, key), sessionToken });
  });
  app.use("/rooms/:code", (req, _res, next) => {
    const code = req.params.code.toUpperCase(),
      room = rooms.get(code);
    if (!room || Date.now() - room.updated > day) {
      rooms.delete(code);
      fail("Room not found. Check the six-character code with your host.", 404);
    }
    req.room = room;
    req.key = keyOf(req);
    req.player = room.players.find((p) => req.key && p.key === req.key);
    next();
  });
  const sendState = (req, res) => res.json(view(req.room, req.key));
  app.get("/rooms/:code", sendState);
  // A read-only POST allows polling a private hand without putting the token
  // in headers or URLs. It does not change the room or its revision.
  app.post("/rooms/:code/state", sendState);
  app.post("/rooms/:code/join", (req, res) => {
    const { key, sessionToken } = entrySession(req.key);
    const r = req.room;
    if (!req.player) {
      joinRoom(r,req.body || {},key);
      save(r);
    }
    res.json({ ...view(r, key), sessionToken });
  });
  app.post("/rooms/:code/:action", (req, res) => {
    const r = req.room,
      p = req.player,
      b = req.body || {};
    const result = operate(r,p,req.params.action,b);
    if (result?.remove) rooms.delete(r.code);
    save(r);
    res.json(result?.left ? {left:true} : view(r, req.key));
  });
  app.use((_req, res) => res.status(404).json({ error: "No such endpoint." }));
  app.use((err, _req, res, _next) =>
    res
      .status(err.status || 400)
      .json({ error: err.message || "Something went wrong." }),
  );
  return app;
}
