import { randomInt } from "node:crypto";
import {
  BOARD,
  PRICES,
  RESOURCES,
  affordable,
  points,
  targets,
  vacant,
} from "../shared/island.mjs";

const choose = (list) => list[randomInt(list.length)];
const shuffle = (entries) => {
  const a = [...entries];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const check = (ok, message) => {
  if (!ok) throw new Error(message);
};
const log = (g, text) => {
  g.log.push({ id: ++g.seq, text });
  g.log = g.log.slice(-40);
};

export function startGame(room) {
  check(room.status === "waiting", "This game has already started.");
  check(room.players.length >= 2, "Invite a friend or add a bot to start.");
  const types = shuffle(
    RESOURCES.flatMap((r) =>
      Array(["ore", "brick"].includes(r) ? 3 : 4).fill(r),
    ).concat("desert"),
  );
  const numbers = shuffle([
    2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12,
  ]);
  const g = {
    tiles: types.map((r) => ({
      resource: r,
      number: r === "desert" ? 0 : numbers.pop(),
    })),
    buildings: {},
    roads: {},
    hands: {},
    robber: types.indexOf("desert"),
    turn: 0,
    round: 1,
    phase: "roll",
    dice: null,
    winner: null,
    offer: null,
    seq: 0,
    log: [],
  };
  for (const p of room.players)
    g.hands[p.id] = { lumber: 2, brick: 2, wool: 1, grain: 1, ore: 0 };
  // Balanced automatic setup in snake order. Prefer intersections touching three productive tiles.
  for (const p of [...room.players, ...room.players.slice().reverse()]) {
    const available = shuffle(BOARD.vertices.filter((v) => vacant(g, v)));
    const score = (v) =>
      v.tiles.reduce(
        (s, t) =>
          s + (g.tiles[t].number ? 7 - Math.abs(7 - g.tiles[t].number) : 0),
        0,
      );
    const v = available.sort((a, b) => score(b) - score(a))[
      randomInt(Math.min(3, available.length))
    ];
    g.buildings[v.id] = { owner: p.id, kind: "settlement" };
    g.roads[choose(v.edges)] = p.id;
  }
  room.game = g;
  room.status = "playing";
  log(
    g,
    "The island is settled! Each player starts with two settlements and two roads.",
  );
}
function roll(room, p) {
  const g = room.game;
  check(g.phase === "roll", "The dice have already been rolled.");
  g.dice = [randomInt(1, 7), randomInt(1, 7)];
  const sum = g.dice[0] + g.dice[1];
  g.phase = sum === 7 ? "robber" : "build";
  log(g, `${p.name} rolled ${sum}.`);
  if (sum === 7) {
    log(g, `${p.name} must move the robber to another tile.`);
    return;
  }
  const collected = new Map();
  g.tiles.forEach((t, i) => {
    if (t.number !== sum || i === g.robber) return;
    BOARD.tiles[i].corners.forEach((v) => {
      const b = g.buildings[v];
      if (!b) return;
      const qty = b.kind === "city" ? 2 : 1;
      g.hands[b.owner][t.resource] += qty;
      const k = room.players.find((a) => a.id === b.owner).name;
      collected.set(k, (collected.get(k) || 0) + qty);
    });
  });
  if (collected.size)
    log(
      g,
      "Harvest: " +
        [...collected].map(([n, c]) => `${n} +${c}`).join(", ") +
        ".",
    );
  else log(g, "No occupied tiles produced resources this roll.");
}
function moveRobber(room, p, tile) {
  const g = room.game;
  check(
    g.phase === "robber" &&
      Number.isInteger(tile) &&
      g.tiles[tile] &&
      tile !== g.robber,
    "Choose a different tile for the robber.",
  );
  g.robber = tile;
  g.phase = "build";
  const rivals = [
    ...new Set(
      BOARD.tiles[tile].corners
        .map((v) => g.buildings[v]?.owner)
        .filter(
          (id) =>
            id && id !== p.id && Object.values(g.hands[id]).some((n) => n > 0),
        ),
    ),
  ];
  if (rivals.length) {
    const rival = choose(rivals),
      hand = g.hands[rival],
      resource = choose(RESOURCES.filter((r) => hand[r] > 0));
    hand[resource]--;
    g.hands[p.id][resource]++;
    log(
      g,
      `${p.name} moved the robber and took a resource from ${room.players.find((a) => a.id === rival).name}.`,
    );
  } else log(g, `${p.name} moved the robber.`);
}
function build(room, p, kind, site) {
  const g = room.game,
    hand = g.hands[p.id];
  check(
    g.phase === "build",
    "Roll the dice and resolve the robber before building.",
  );
  check(
    Object.hasOwn(PRICES, kind) &&
      Number.isInteger(site) &&
      targets(g, p.id, kind).includes(site),
    "That is not an available building site.",
  );
  check(
    affordable(hand, PRICES[kind]),
    "You need more resources to build that.",
  );
  for (const [r, n] of Object.entries(PRICES[kind])) hand[r] -= n;
  if (kind === "road") g.roads[site] = p.id;
  else g.buildings[site] = { owner: p.id, kind };
  log(g, `${p.name} built a ${kind}.`);
  if (points(g, p.id) >= room.goal) {
    g.winner = p.id;
    g.offer = null;
    room.status = "finished";
    log(g, `${p.name} won with ${points(g, p.id)} victory points!`);
  }
}
const tradePair = (give, get) =>
  RESOURCES.includes(give) && RESOURCES.includes(get) && give !== get;
function trade(room, p, give, get, peer) {
  const g = room.game,
    hand = g.hands[p.id];
  check(
    g.phase === "build",
    "Roll the dice and resolve the robber before trading.",
  );
  check(tradePair(give, get), "Choose two different resources.");
  if (peer) {
    check(hand[give] >= 1, "You do not have that resource to offer.");
    g.offer = { from: p.id, give, get };
    log(g, `${p.name} offered 1 ${give} for 1 ${get}.`);
    const bot = room.players.find(
      (a) =>
        a.isBot &&
        a.id !== p.id &&
        g.hands[a.id][get] > 1 &&
        g.hands[a.id][give] < g.hands[a.id][get],
    );
    if (bot) acceptOffer(room, bot);
  } else {
    check(hand[give] >= 4, "The bank needs four of the same resource.");
    hand[give] -= 4;
    hand[get]++;
    log(g, `${p.name} traded 4 ${give} for 1 ${get} at the bank.`);
  }
}
function acceptOffer(room, p) {
  const g = room.game,
    o = g.offer;
  check(o && o.from !== p.id, "That offer is no longer available.");
  check(
    g.hands[o.from][o.give] >= 1 && g.hands[p.id][o.get] >= 1,
    "There are not enough resources for this trade.",
  );
  g.hands[o.from][o.give]--;
  g.hands[o.from][o.get]++;
  g.hands[p.id][o.get]--;
  g.hands[p.id][o.give]++;
  g.offer = null;
  log(g, `${p.name} accepted the trade.`);
}
function endTurn(room) {
  const g = room.game;
  check(
    g.phase === "build",
    "Finish rolling the dice before ending your turn.",
  );
  g.turn = (g.turn + 1) % room.players.length;
  if (g.turn === 0) g.round++;
  g.phase = "roll";
  g.offer = null;
}
export function playBots(room) {
  // A disconnected human keeps their seat; only explicitly added/replacement bots act.
  while (
    room.status === "playing" &&
    room.players[room.game.turn].isBot &&
    room.players.some((p) => !p.isBot)
  ) {
    const g = room.game,
      p = room.players[g.turn],
      hand = g.hands[p.id];
    if (g.phase === "roll") roll(room, p);
    if (g.phase === "robber") {
      const elsewhere = BOARD.tiles.filter((t) => t.id !== g.robber);
      const safe = elsewhere.filter(
        (t) => !t.corners.some((v) => g.buildings[v]?.owner === p.id),
      );
      const rivals = safe.filter((t) => t.corners.some((v) => g.buildings[v]));
      const tile = choose(
        rivals.length ? rivals : safe.length ? safe : elsewhere,
      );
      moveRobber(room, p, tile.id);
    }
    const wanted = RESOURCES.filter((r) => hand[r] === 0),
      spare = RESOURCES.filter((r) => hand[r] >= 5);
    if (spare.length && wanted.length)
      trade(room, p, choose(spare), choose(wanted), false);
    for (const kind of ["city", "settlement", "road"]) {
      const sites = targets(g, p.id, kind);
      if (sites.length && affordable(hand, PRICES[kind])) {
        build(room, p, kind, choose(sites));
        break;
      }
    }
    if (room.status === "playing") endTurn(room);
  }
}
export function act(room, p, data) {
  check(room.status === "playing", "There is no active game in this room.");
  const g = room.game;
  if (data.type === "accept") return acceptOffer(room, p);
  check(room.players[g.turn].id === p.id, "Wait for your turn.");
  switch (data.type) {
    case "roll":
      return roll(room, p);
    case "robber":
      return moveRobber(room, p, data.tile);
    case "build":
      return build(room, p, data.kind, data.site);
    case "trade":
      return trade(room, p, data.give, data.get, data.partner === "table");
    case "cancelOffer":
      g.offer = null;
      return;
    case "end":
      endTurn(room);
      return playBots(room);
    default:
      throw new Error("Unknown game action.");
  }
}
