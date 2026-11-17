import React from "react";
import { BOARD } from "../../shared/island.mjs";
import { ResourceArt } from "./Art.jsx";

const terrain = {
  lumber: ["#7eab7a", "#578969", "#3c674e"],
  brick: ["#d19675", "#b8795b", "#8d5a48"],
  wool: ["#b0c789", "#91b17a", "#688752"],
  grain: ["#e5c882", "#d6ad65", "#ac8b54"],
  ore: ["#a4b0c4", "#8a97af", "#636f86"],
  desert: ["#d8c397", "#c1ab7e", "#9d8862"],
};
function keyClick(event, fn) {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    fn();
  }
}
function Building({ x, y, kind, color }) {
  return (
    <g transform={`translate(${x} ${y - 1})`}>
      <ellipse
        cy="5"
        rx={kind === "city" ? 13 : 10}
        ry="5"
        fill="#26343b"
        opacity=".4"
      />
      {kind === "city" ? (
        <>
          <path
            d="M-12 3v-13l5-4 5 3v5l7-4 8 5V6L0 12z"
            fill={color}
            stroke="#29373d"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="m-12-10 5 3 5-4m-5 4v10m5-9 8 5 7-4M6-1V8"
            fill="none"
            stroke="#36414d"
            opacity=".65"
            strokeWidth="1.7"
          />
        </>
      ) : (
        <>
          <path
            d="m-10-2 7-10 13 7v12L0 12-10 6z"
            fill={color}
            stroke="#27343e"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="m-3-12 6 12 7-5M3 0v10M-10-2 3 5"
            stroke="#3c4141"
            opacity=".65"
            fill="none"
            strokeWidth="1.7"
          />
        </>
      )}
    </g>
  );
}
export default function Board({ room, mode, sites, choose, busy }) {
  const g = room.game,
    color = (id) => room.players.find((p) => p.id === id)?.color || "#ddd";
  const robber = mode === "robber";
  const poly = (t, dy = 0) =>
    t.corners
      .map((i) => `${BOARD.vertices[i].x},${BOARD.vertices[i].y + dy}`)
      .join(" ");
  return (
    <svg
      className="island-board"
      viewBox="0 0 600 515"
      aria-label="Game board with 19 resource tiles, roads, and settlements"
    >
      <defs>
        {Object.entries(terrain).map(([r, c]) => (
          <linearGradient id={"terrain-" + r} key={r} x2=".8" y2="1">
            <stop stopColor={c[0]} />
            <stop offset="1" stopColor={c[1]} />
          </linearGradient>
        ))}
        <pattern
          id="waves"
          width="76"
          height="56"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M7 25q5 3 11 0m27 20q8 3 15-1"
            fill="none"
            stroke="#7cb4be"
            strokeWidth="1.2"
            opacity=".14"
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width="600" height="515" fill="url(#waves)" />
      {BOARD.tiles.map((t) => (
        <polygon
          key={t.id}
          points={poly(t, 7)}
          fill={terrain[g.tiles[t.id].resource][2]}
          stroke="#284b52"
          strokeWidth="1.8"
        />
      ))}
      {BOARD.tiles.map((t) => {
        const info = g.tiles[t.id],
          blocked = t.id === g.robber,
          clickable = robber && !blocked && !busy;
        return (
          <g
            key={t.id}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-label={`${info.resource} ${info.number || "desert"}${blocked ? ", blocked by the robber" : ""}, tile ${t.id + 1}`}
            onClick={clickable ? () => choose(t.id) : undefined}
            onKeyDown={
              clickable ? (e) => keyClick(e, () => choose(t.id)) : undefined
            }
            className={clickable ? "select-tile" : ""}
          >
            <title>
              {info.resource} · {info.number || "desert"}
              {blocked ? " · Robber" : ""}
            </title>
            <polygon
              points={poly(t)}
              fill={`url(#terrain-${info.resource})`}
              stroke="#e2d4a0"
              strokeWidth="1.9"
            />
            <polygon
              points={t.corners
                .map(
                  (i) =>
                    `${t.x + (BOARD.vertices[i].x - t.x) * 0.92},${t.y + (BOARD.vertices[i].y - t.y) * 0.92}`,
                )
                .join(" ")}
              stroke="#ffffff"
              opacity=".18"
              strokeWidth="1"
              fill="none"
            />
            {info.resource !== "desert" ? (
              <g transform={`translate(${t.x - 21} ${t.y - 39})`}>
                <ResourceArt type={info.resource} size={42} />
              </g>
            ) : (
              <path
                d={`m${t.x - 25} ${t.y + 4}q13-23 26-7 12-10 25 1`}
                fill="none"
                stroke="#a88c5d"
                strokeWidth="4"
              />
            )}
            {info.number > 0 && (
              <g transform={`translate(${t.x} ${t.y + 14})`}>
                <circle cy="2" r="16" fill="#5e563e" opacity=".24" />
                <circle
                  r="16"
                  fill="#f4e5be"
                  stroke="#9e916a"
                  strokeWidth="1.3"
                />
                <text
                  y="4"
                  textAnchor="middle"
                  fill={[6, 8].includes(info.number) ? "#ad5742" : "#3e4140"}
                  fontSize="18"
                  fontWeight="800"
                  fontFamily="Bricolage, sans-serif"
                >
                  {info.number}
                </text>
                {Array.from(
                  { length: 6 - Math.abs(7 - info.number) },
                  (_, i) => (
                    <circle
                      key={i}
                      cx={(i - (5 - Math.abs(7 - info.number)) / 2) * 2.7}
                      cy="9.1"
                      r=".85"
                      fill="#81724e"
                    />
                  ),
                )}
              </g>
            )}
            {blocked && (
              <g
                transform={`translate(${t.x + (info.number ? 23 : 0)} ${t.y + 3})`}
              >
                <path
                  d="m-9 14 4-14h10l4 14q-8 4-18 0"
                  fill="#34404a"
                  stroke="#efddb8"
                  strokeWidth="1.7"
                />
                <circle
                  cy="-6"
                  r="6.6"
                  fill="#34404a"
                  stroke="#efddb8"
                  strokeWidth="1.7"
                />
              </g>
            )}
          </g>
        );
      })}
      {Object.entries(g.roads).map(([site, owner]) => {
        const e = BOARD.edges[site],
          a = BOARD.vertices[e.a],
          b = BOARD.vertices[e.b];
        const p = {
          x1: a.x * 0.89 + b.x * 0.11,
          x2: b.x * 0.89 + a.x * 0.11,
          y1: a.y * 0.89 + b.y * 0.11,
          y2: b.y * 0.89 + a.y * 0.11,
        };
        return (
          <g key={site}>
            <line
              {...p}
              stroke="#34453e"
              strokeWidth="8.5"
              strokeLinecap="round"
            />
            <line
              {...p}
              stroke={color(owner)}
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
        );
      })}
      {Object.entries(g.buildings).map(([v, b]) => (
        <Building
          key={v}
          {...BOARD.vertices[v]}
          kind={b.kind}
          color={color(b.owner)}
        />
      ))}
      {["road", "settlement", "city"].includes(mode) &&
        sites.map((i) => {
          let x, y;
          if (mode === "road") {
            const e = BOARD.edges[i],
              a = BOARD.vertices[e.a],
              b = BOARD.vertices[e.b];
            x = (a.x + b.x) / 2;
            y = (a.y + b.y) / 2;
          } else {
            x = BOARD.vertices[i].x;
            y = BOARD.vertices[i].y;
          }
          const click = () => !busy && choose(i);
          return (
            <g
              key={i}
              className="build-site"
              transform={`translate(${x} ${y})`}
              role="button"
              aria-label={`Build ${mode} at site ${i + 1}`}
              tabIndex={0}
              onClick={click}
              onKeyDown={(e) => keyClick(e, click)}
            >
              <circle r="15" fill="transparent" />
              <circle r="9" fill="#173943" stroke="#a1f4d6" strokeWidth="2.3" />
              <path
                d="M-4 0h8M0-4v8"
                stroke="#b3ffe4"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          );
        })}
    </svg>
  );
}
