import { randomBytes, randomInt, randomUUID, createHash } from "node:crypto";
import { act, startGame, playBots } from "./game.mjs";
import { ANIMALS, COLORS, points } from "../shared/island.mjs";
import { isSessionToken } from "../shared/session.mjs";
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const freshCode = () =>
  Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join(
    "",
  );
const clean = (s, max) =>
  typeof s === "string"
    ? s
        .trim()
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .slice(0, max)
        .trim()
    : "";
export const fail = (message, status = 400) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
export const day = 86_400_000;
const hashToken = (token) => createHash("sha256").update(token).digest("hex");
export const sessionKey = (body, authorization) => {
  // Explicit null means a new browser session. Never mistake a proxy's own
  // Authorization header for a seat on requests from the current client.
  const token = Object.hasOwn(body ?? {}, "sessionToken")
    ? body.sessionToken
    : authorization?.match(/^Bearer ([\w-]{24,100})$/)?.[1];
  return isSessionToken(token) ? hashToken(token) : null;
};
export function entrySession(key) {
  if (key) return { key };
  const sessionToken = randomBytes(32).toString("base64url");
  return { key: hashToken(sessionToken), sessionToken };
}
function makePlayer(body, key, players, isBot = false) {
  const name = clean(body.name, 20);
  if (!name) fail("Enter a settler name.");
  return {
    id: randomUUID(),
    key,
    name,
    avatar: ANIMALS.includes(body.avatar) ? body.avatar : "fox",
    color: COLORS.find((c) => !players.some((p) => p.color === c)),
    isBot,
  };
}
export function view(room, key) {
  const self = room.players.find((p) => key && p.key === key),
    g = room.game;
  const publicRoom = {
    code: room.code,
    name: room.name,
    limit: room.limit,
    goal: room.goal,
    status: room.status,
    count: room.players.length,
    isMember: !!self,
  };
  if (!self) return publicRoom;
  let game = null;
  if (g) {
    const { hands, ...common } = g;
    game = { ...common, hand: hands[self.id] };
  }
  return {
    ...publicRoom,
    you: self.id,
    host: room.host,
    revision: room.revision,
    players: room.players.map(({ key: _key, ...p }) => ({
      ...p,
      points: g ? points(g, p.id) : 0,
      cards: g ? Object.values(g.hands[p.id]).reduce((a, b) => a + b, 0) : 0,
    })),
    messages: room.messages,
    game,
  };
}


export function newRoom(body, key) {
    const player = makePlayer(body, key, []),
      limit = Number(body.limit || 4),
      goal = Number(body.goal || 8);
    if (![2, 3, 4].includes(limit) || ![6, 8, 10].includes(goal))
      fail("Choose a valid table size and victory target.");
    const name = clean(body.roomName, 40);
    if (!name) fail("Give your room a name.");
    const code = freshCode();
    return {
      code,
      name,
      limit,
      goal,
      players: [player],
      host: player.id,
      status: "waiting",
      messages: [],
      game: null,
      updated: Date.now(),
      revision: 0,
    };
}
export function joinRoom(r,body,key) {
      if (r.status !== "waiting")
        fail(
          "This island is already in play. Ask the host to invite you to the next game.",
          409,
        );
      if (r.players.length >= r.limit)
        fail("All seats are taken. Ask your host to open a seat.", 409);
      r.players.push(makePlayer(body, key, r.players));
}
export function operate(r,p,action,b) {
    if (!p) fail("Join this room first.", 403);
    const host = () => {
      if (r.host !== p.id) fail("Only the host can do that.", 403);
    };
    const waiting = () => {
      if (r.status !== "waiting") fail("The game has already started.", 409);
    };
    switch (action) {
      case "bot": {
        host();
        waiting();
        if (r.players.length >= r.limit) fail("All seats are taken.");
        const names = ["Cedar", "Bramble", "Pip", "Fern"];
        const i = names.findIndex((n) => !r.players.some((a) => a.name === n));
        r.players.push(
          makePlayer(
            { name: names[i], avatar: ANIMALS[(i + 1) % 4] },
            null,
            r.players,
            true,
          ),
        );
        break;
      }
      case "removeBot":
        host();
        waiting();
        r.players = r.players.filter((a) => a.id !== b.id || !a.isBot);
        break;
      case "profile": {
        const name = clean(b.name, 20);
        if (!name) fail("Enter a settler name.");
        p.name = name;
        if (ANIMALS.includes(b.avatar)) p.avatar = b.avatar;
        break;
      }
      case "chat": {
        const text = clean(b.text, 320);
        if (!text) fail("Write a message first.");
        r.messages.push({
          id: randomUUID(),
          who: p.id,
          name: p.name,
          text,
          time: Date.now(),
        });
        r.messages = r.messages.slice(-60);
        break;
      }
      case "start":
        host();
        waiting();
        startGame(r);
        break;
      case "play":
        act(r, p, b);
        break;
      case "again":
        host();
        if (r.status !== "finished") fail("Finish this game first.");
        r.status = "waiting";
        r.game = null;
        break;
      case "leave": {
        if (r.status === "waiting")
          r.players = r.players.filter((a) => a.id !== p.id);
        else {
          p.isBot = true;
          p.key = null;
        }
        const next = r.players.find((a) => !a.isBot);
        if (!next) return { remove: true, left: true };
        else {
          if (r.host === p.id) r.host = next.id;
          if (r.game) playBots(r);
        }
        return { left: true };
      }
      default:
        fail("Unknown room action.", 404);
    }
}
