import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import { createApi } from "../server/api.mjs";
import { createRoomClient } from "../src/room-client.js";
import { targets } from "../shared/island.mjs";
import { isSessionToken } from "../shared/session.mjs";

// Exercise the actual browser request builder and room server, with an edge
// that either strips Authorization or replaces it with its own credential.
async function preview(t, edgeToken) {
  const app = express();
  app.use(
    "/api",
    (req, _res, next) => {
      delete req.headers.authorization;
      delete req.headers.cookie;
      if (edgeToken) req.headers.authorization = `Bearer ${edgeToken}`;
      next();
    },
    createApi({ persist: false }),
  );
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return (path, options) => {
    assert.ok(!path.includes("?"), "never put the player credential in a URL");
    return fetch(`http://127.0.0.1:${server.address().port}${path}`, options);
  };
}
const table = { name: "Rowan", roomName: "Game night", limit: 2, goal: 6 };
async function takeTurn(client, path, you) {
  const play = (action) => client.api(path + "/play", action);
  let r = await play({ type: "roll" });
  if (r.game.phase === "robber") {
    r = await play({
      type: "robber",
      tile: (r.game.robber + 1) % r.game.tiles.length,
    });
  }
  const site = targets(r.game, you, "road")[0];
  const built = await play({ type: "build", kind: "road", site });
  assert.equal(built.game.roads[site], you);
  return play({ type: "end" });
}

test("create a room with no usable saved session, poll it, and play a bot without auth headers or writable storage", async (t) => {
  const request = await preview(t);
  const host = createRoomClient({
    request,
    readSession: () => ({ stale: true }),
    writeSession: () => {},
  });
  const room = await host.api("/rooms", table);
  assert.equal(room.isMember, true);
  assert.equal(room.you, room.host);
  assert.equal(
    room.sessionToken,
    undefined,
    "the UI never receives the credential in its room model",
  );
  const path = `/rooms/${room.code}`;
  const state = await host.readRoom(room.code);
  assert.equal(state.you, room.you);
  assert.equal(state.revision, room.revision, "polls do not mutate the room");
  await host.api(path + "/bot", {});
  const game = await host.api(path + "/start", {});
  assert.equal(game.status, "playing");
  const next = await takeTurn(host, path, room.you);
  assert.equal(next.game.round, 2);
  assert.equal(next.players[next.game.turn].id, room.you);
});

test("separate invited players can join, reload and take turns even with one shared upstream auth header", async (t) => {
  const edgeToken = randomUUID(),
    request = await preview(t, edgeToken);
  function tab() {
    let saved = null;
    const open = () =>
      createRoomClient({
        request,
        readSession: () => saved,
        writeSession: (value) => {
          saved = value;
        },
      });
    return { open, saved: () => saved };
  }
  const hostTab = tab(),
    guestTab = tab(),
    host = hostTab.open(),
    guest = guestTab.open();
  const r = await host.api("/rooms", table),
    path = "/rooms/" + r.code;
  const invite = await guest.readRoom(r.code);
  assert.equal(invite.isMember, false);
  assert.equal(invite.players, undefined);
  await assert.rejects(guest.api(path + "/start", {}), { status: 403 });
  assert.equal(
    guestTab.saved(),
    null,
    "ordinary reads and actions do not mint seats",
  );
  const joined = await guest.api(path + "/join", { name: "Piper" });
  assert.notEqual(r.you, joined.you);
  assert.ok(
    isSessionToken(hostTab.saved()) && isSessionToken(guestTab.saved()),
  );
  assert.notEqual(hostTab.saved(), guestTab.saved());
  assert.notEqual(hostTab.saved(), edgeToken);
  assert.equal((await host.readRoom(r.code)).count, 2);
  await assert.rejects(guest.api(path + "/start", {}), { status: 403 });
  await host.api(path + "/start", {});
  await takeTurn(host, path, r.you);
  const reloaded = guestTab.open(),
    state = await reloaded.readRoom(r.code);
  assert.equal(state.you, joined.you);
  assert.equal(state.players[state.game.turn].id, joined.you);
  assert.ok(state.game.hand);
  assert.equal(state.game.hands, undefined);
  assert.ok(!JSON.stringify(state).includes(hostTab.saved()));
  const next = await takeTurn(reloaded, path, joined.you);
  assert.equal(next.game.round, 2);
  assert.equal((await host.readRoom(r.code)).players[next.game.turn].id, r.you);
});
