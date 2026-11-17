import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApi } from "../server/api.mjs";

async function server(options = { persist: false }) {
  const app = createApi(options),
    s = await new Promise((resolve) => {
      const srv = app.listen(0, "127.0.0.1", () => resolve(srv));
    });
  const base = "http://127.0.0.1:" + s.address().port;
  return {
    close: () => new Promise((resolve) => s.close(resolve)),
    call: async (path, key, data) => {
      const resp = await fetch(base + path, {
        method: data === undefined ? "GET" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + key,
        },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
      return { status: resp.status, data: await resp.json() };
    },
  };
}
const host = randomUUID(),
  friend = randomUUID(),
  other = randomUUID(),
  draft = {
    name: "Cove",
    avatar: "fox",
    roomName: "Test island",
    limit: 2,
    goal: 6,
  };

test("invite, join, chat, start, reconnect and hand off a host across separate sessions", async (t) => {
  const s = await server();
  t.after(s.close);
  const { status, data: r } = await s.call("/rooms", host, draft);
  assert.equal(status, 201);
  assert.match(r.code, /^[A-Z2-9]{6}$/);
  const path = "/rooms/" + r.code;
  assert.equal((await s.call(path + "/start", host, {})).status, 400);
  const meta = (await s.call(path.toLowerCase(), friend)).data;
  assert.equal(meta.isMember, false);
  assert.equal(meta.count, 1);
  assert.equal(meta.players, undefined);
  const joined = (
    await s.call(path + "/join", friend, { name: "Piper", avatar: "owl" })
  ).data;
  assert.equal(joined.count, 2);
  assert.equal(joined.isMember, true);
  assert.notEqual(joined.you, r.you);
  assert.equal(joined.players[0].key, undefined);
  assert.equal(
    (await s.call(path + "/join", friend, { name: "Piper" })).data.count,
    2,
  );
  assert.equal(
    (await s.call(path + "/join", other, { name: "Seat 3" })).status,
    409,
  );
  assert.equal((await s.call(path + "/start", friend, {})).status, 403);
  assert.equal(
    (await s.call(path + "/chat", other, { text: "no seat" })).status,
    403,
  );
  await s.call(path + "/chat", friend, { text: "Hello, island!" });
  assert.equal(
    (await s.call(path, host)).data.messages[0].text,
    "Hello, island!",
  );
  const inGame = (await s.call(path + "/start", host, {})).data;
  assert.equal(inGame.status, "playing");
  assert.equal(inGame.game.hands, undefined);
  assert.deepEqual(inGame.game.hand, {
    lumber: 2,
    brick: 2,
    wool: 1,
    grain: 1,
    ore: 0,
  });
  assert.equal(
    (await s.call(path + "/play", friend, { type: "roll" })).status,
    400,
  );
  await s.call(path + "/leave", host, {});
  const now = (await s.call(path, friend)).data;
  assert.equal(now.host, joined.you);
  assert.equal(now.players[0].isBot, true);
  assert.equal(now.game.turn, 1);
  assert.equal((await s.call(path, host)).data.isMember, false);
  await s.call(path + "/leave", friend, {});
  assert.equal((await s.call(path, other)).status, 404);
});
test("the host manages bot seats and cannot exceed the room size", async (t) => {
  const s = await server();
  t.after(s.close);
  const room = (await s.call("/rooms", host, draft)).data,
    path = "/rooms/" + room.code;
  const bot = (await s.call(path + "/bot", host, {})).data.players.find(
    (p) => p.isBot,
  );
  assert.ok(bot);
  assert.equal((await s.call(path + "/bot", host, {})).status, 400);
  const open = (await s.call(path + "/removeBot", host, { id: bot.id })).data;
  assert.equal(open.count, 1);
  const live = (await s.call(path + "/join", friend, { name: "Fern" })).data;
  assert.equal(live.status, "waiting");
  await s.call(path + "/leave", host, {});
  assert.equal((await s.call(path, friend)).data.host, live.you);
});
test("rooms, membership and messages survive a server restart", async (t) => {
  const dataDir = await mkdtemp(join(tmpdir(), "colonist-rooms-"));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  const first = await server({ dataDir });
  const room = (await first.call("/rooms", host, draft)).data;
  await first.call("/rooms/" + room.code + "/chat", host, {
    text: "See you soon!",
  });
  await first.close();
  const next = await server({ dataDir });
  t.after(next.close);
  const restored = (await next.call("/rooms/" + room.code, host)).data;
  assert.equal(restored.you, room.you);
  assert.equal(restored.messages[0].text, "See you soon!");
});
test("bad names, target settings, and missing rooms give actionable errors", async (t) => {
  const s = await server();
  t.after(s.close);
  assert.equal(
    (await s.call("/rooms", host, { ...draft, roomName: " " })).status,
    400,
  );
  assert.equal(
    (await s.call("/rooms", host, { ...draft, goal: -2 })).status,
    400,
  );
  assert.equal(
    (await s.call("/rooms", host, { ...draft, name: " " })).status,
    400,
  );
  assert.equal((await s.call("/rooms/AAAAAA", friend)).status, 404);
});
