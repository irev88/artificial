import test from "node:test";
import assert from "node:assert/strict";
import { BOARD, targets, points } from "../shared/island.mjs";
import { act, startGame } from "../server/game.mjs";
const players = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `seat-${i}`,
    name: `Settler ${i}`,
    isBot: false,
  }));
const ready = (n = 2) => {
  const r = { players: players(n), status: "waiting", goal: 8 };
  startGame(r);
  return r;
};

test("the 19-tile island has one shared intersection/edge graph", () => {
  assert.equal(BOARD.tiles.length, 19);
  assert.equal(BOARD.vertices.length, 54);
  assert.equal(BOARD.edges.length, 72);
  for (const e of BOARD.edges) {
    assert.ok(BOARD.vertices[e.a].neighbors.includes(e.b));
    assert.ok(BOARD.vertices[e.b].edges.includes(e.id));
  }
});
test("four-player snake setup leaves legal settlements and separate starting roads", () => {
  for (let i = 0; i < 100; i++) {
    const r = ready(4),
      g = r.game;
    assert.equal(Object.keys(g.roads).length, 8);
    assert.equal(Object.keys(g.buildings).length, 8);
    for (const p of r.players) assert.equal(points(g, p.id), 2);
    for (const v of Object.keys(g.buildings))
      assert.ok(BOARD.vertices[v].neighbors.every((n) => !g.buildings[n]));
    assert.equal(g.tiles.filter((t) => t.resource === "desert").length, 1);
    assert.equal(g.tiles[g.robber].number, 0);
  }
});
test("only the active player can roll, build or end the turn", () => {
  const r = ready(),
    [host, guest] = r.players;
  assert.throws(() => act(r, guest, { type: "roll" }), /your turn/);
  assert.throws(() => act(r, host, { type: "end" }), /rolling/);
  act(r, host, { type: "roll" });
  assert.ok(r.game.dice.every((n) => n >= 1 && n <= 6));
  assert.throws(() => act(r, host, { type: "roll" }), /already/);
  if (r.game.phase === "robber")
    act(r, host, { type: "robber", tile: (r.game.robber + 1) % 19 });
  act(r, host, { type: "end" });
  assert.equal(r.game.turn, 1);
  assert.equal(r.game.phase, "roll");
});
test("roads require a valid connection and the resources are spent exactly once", () => {
  const r = ready(),
    p = r.players[0],
    g = r.game;
  g.phase = "build";
  const sites = targets(g, p.id, "road"),
    invalid = BOARD.edges.find((e) => !sites.includes(e.id)).id;
  assert.throws(
    () => act(r, p, { type: "build", kind: "road", site: invalid }),
    /not an available/,
  );
  const s = sites[0];
  act(r, p, { type: "build", kind: "road", site: s });
  assert.equal(g.roads[s], p.id);
  assert.equal(g.hands[p.id].lumber, 1);
  assert.equal(g.hands[p.id].brick, 1);
  assert.throws(
    () => act(r, p, { type: "build", kind: "road", site: s }),
    /not an available/,
  );
  g.hands[p.id].lumber = 0;
  assert.throws(
    () =>
      act(r, p, {
        type: "build",
        kind: "road",
        site: targets(g, p.id, "road")[0],
      }),
    /more resources/,
  );
});
test("an upgrade doubles a settlement’s points and ends a winning game", () => {
  const r = ready(),
    p = r.players[0],
    g = r.game;
  r.goal = 3;
  g.phase = "build";
  g.hands[p.id].grain = 2;
  g.hands[p.id].ore = 3;
  act(r, p, { type: "build", kind: "city", site: targets(g, p.id, "city")[0] });
  assert.equal(points(g, p.id), 3);
  assert.equal(g.winner, p.id);
  assert.equal(r.status, "finished");
  assert.throws(() => act(r, p, { type: "end" }), /no active game/);
});
test("robber must move to another tile before building or ending a turn", () => {
  const r = ready(),
    p = r.players[0],
    g = r.game;
  g.phase = "robber";
  assert.throws(
    () => act(r, p, { type: "robber", tile: g.robber }),
    /different tile/,
  );
  assert.throws(() => act(r, p, { type: "end" }), /rolling/);
  const v = Number(
    Object.keys(g.buildings).find(
      (v) => g.buildings[v].owner === r.players[1].id,
    ),
  );
  const tile = BOARD.vertices[v].tiles.find((i) => i !== g.robber);
  const total = (id) => Object.values(g.hands[id]).reduce((a, b) => a + b, 0),
    before = total(p.id);
  act(r, p, { type: "robber", tile });
  assert.equal(g.robber, tile);
  assert.equal(g.phase, "build");
  assert.equal(total(p.id), before + 1);
});
test("bank trade validates both sides; peer offers settle atomically", () => {
  const r = ready(),
    [a, b] = r.players,
    g = r.game;
  g.phase = "build";
  assert.throws(
    () => act(r, a, { type: "trade", give: "lumber", get: "ore" }),
    /four/,
  );
  g.hands[a.id].lumber = 4;
  act(r, a, { type: "trade", give: "lumber", get: "ore" });
  assert.equal(g.hands[a.id].lumber, 0);
  assert.equal(g.hands[a.id].ore, 1);
  act(r, a, { type: "trade", give: "ore", get: "lumber", partner: "table" });
  act(r, b, { type: "accept" });
  assert.equal(g.hands[b.id].ore, 1);
  assert.equal(g.hands[a.id].lumber, 1);
  assert.equal(g.offer, null);
  assert.throws(() => act(r, b, { type: "accept" }), /no longer/);
});
test("bot turns return control to a human and advance rounds", () => {
  const r = ready(4);
  r.players.slice(1).forEach((p) => (p.isBot = true));
  r.game.phase = "build";
  act(r, r.players[0], { type: "end" });
  assert.equal(r.game.turn, 0);
  assert.equal(r.game.round, 2);
  assert.equal(r.game.phase, "roll");
});
