export const RESOURCES = ["lumber", "brick", "wool", "grain", "ore"];
export const TERRAINS = {
  lumber: "Forest",
  brick: "Hills",
  wool: "Pasture",
  grain: "Fields",
  ore: "Mountains",
  desert: "Desert",
};
export const PRICES = {
  road: { lumber: 1, brick: 1 },
  settlement: { lumber: 1, brick: 1, wool: 1, grain: 1 },
  city: { grain: 2, ore: 3 },
};
export const COLORS = ["#f7b65f", "#67d3be", "#a7a1ee", "#ef9291"];
export const ANIMALS = ["fox", "bear", "owl", "rabbit"];
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const affordable = (hand, price) =>
  Object.entries(price).every(([r, n]) => (hand?.[r] || 0) >= n);

// One shared graph makes the drawn corners/edges exactly match the server's rules.
function makeGraph() {
  const tiles = [],
    vertices = [],
    edges = [];
  const seen = new Map(),
    links = new Map();
  for (let r = -2; r <= 2; r++) {
    for (let q = Math.max(-2, -r - 2); q <= Math.min(2, -r + 2); q++) {
      const id = tiles.length,
        x = 300 + Math.sqrt(3) * 54 * (q + r / 2),
        y = 255 + 81 * r;
      const corners = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i - 90),
          vx = x + 54 * Math.cos(a),
          vy = y + 54 * Math.sin(a);
        const k = `${vx.toFixed(2)},${vy.toFixed(2)}`;
        if (!seen.has(k)) {
          seen.set(k, vertices.length);
          vertices.push({
            id: vertices.length,
            x: vx,
            y: vy,
            tiles: [],
            edges: [],
            neighbors: [],
          });
        }
        const v = seen.get(k);
        vertices[v].tiles.push(id);
        corners.push(v);
      }
      tiles.push({ id, x, y, corners });
      corners.forEach((a, i) => {
        const b = corners[(i + 1) % 6],
          k = [a, b].sort((x, y) => x - y).join(":");
        if (links.has(k)) return;
        const e = edges.length;
        links.set(k, e);
        edges.push({ id: e, a, b });
        vertices[a].edges.push(e);
        vertices[b].edges.push(e);
        vertices[a].neighbors.push(b);
        vertices[b].neighbors.push(a);
      });
    }
  }
  return { tiles, vertices, edges };
}
export const BOARD = makeGraph();
export const vacant = (g, v) =>
  !g.buildings[v.id] && v.neighbors.every((n) => !g.buildings[n]);
export function targets(g, playerId, kind) {
  if (kind === "city")
    return BOARD.vertices
      .filter(
        (v) =>
          g.buildings[v.id]?.owner === playerId &&
          g.buildings[v.id]?.kind === "settlement",
      )
      .map((v) => v.id);
  if (kind === "settlement")
    return BOARD.vertices
      .filter(
        (v) => vacant(g, v) && v.edges.some((e) => g.roads[e] === playerId),
      )
      .map((v) => v.id);
  if (kind === "road") {
    const connected = (v) =>
      g.buildings[v]
        ? g.buildings[v].owner === playerId
        : BOARD.vertices[v].edges.some((e) => g.roads[e] === playerId);
    return BOARD.edges
      .filter((e) => !g.roads[e.id] && (connected(e.a) || connected(e.b)))
      .map((e) => e.id);
  }
  return [];
}
export const points = (g, id) =>
  Object.values(g.buildings).reduce(
    (s, b) => s + (b.owner === id ? (b.kind === "city" ? 2 : 1) : 0),
    0,
  );
