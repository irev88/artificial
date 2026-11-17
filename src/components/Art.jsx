import React, { useId } from "react";

export function BrandMark({ size = 38 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      aria-hidden="true"
      fill="none"
    >
      <path d="m3 31 21-12 23 12-22 13z" fill="#cc8c40" />
      <path d="m3 31 22 12v5L3 36z" fill="#e4a94f" />
      <path d="m25 43 22-12v5L25 48z" fill="#b27c3e" />
      <path d="m2 24 22-13 24 13-23 13z" fill="#ffda90" />
      <path d="m2 24 23 13v6L2 30z" fill="#e7ad5a" />
      <path d="m25 37 23-13v6L25 43z" fill="#c48a44" />
      <path d="m13 21 9-8 9 6v9l-9 5-9-5z" fill="#8c5b31" />
      <path d="m13 20 10 5v8l-10-5z" fill="#b77a3e" />
      <path d="m23 25 8-6v9l-8 5z" fill="#9c6635" />
      <path d="m10 21 9-15 15 8-10 15z" fill="#fbc06d" />
      <path d="m19 6 9 3 9 14-6-3-6-8z" fill="#d99247" />
      <path d="m28 9 9 14-11-6z" fill="#fbce83" />
      <path d="m25 24 4-2v7l-4 2z" fill="#654d35" />
    </svg>
  );
}
export function Avatar({ animal = "fox", size = 38 }) {
  const bg =
    { fox: "#e4b887", bear: "#a7c5a2", owl: "#b8b1d7", rabbit: "#a8cbd5" }[
      animal
    ] || "#e4b887";
  return (
    <svg
      className="avatar"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="24" fill={bg} />
      <path d="M0 35 10 29l6 4 12-12 20 7v20H0z" fill="#413932" opacity=".1" />
      {animal === "fox" ? (
        <>
          <path d="m8 9 12 6 9 1 12-9-2 21-14 15L9 29z" fill="#b25f38" />
          <path d="m10 12 7 6-6 6zm27-1-7 7 7 4z" fill="#684630" />
          <path d="m8 28 10-13 12 1 11 12-15 13z" fill="#d88246" />
          <path d="m8 27 13 3 4 8 5-10 11-1-15 15z" fill="#fae1b5" />
          <path d="m21 35 8-1-4 5z" fill="#33332c" />
          <path d="m14 25 5 2-2 2zm16 1 5-3-2 5z" fill="#34372c" />
        </>
      ) : animal === "bear" ? (
        <>
          <circle cx="12" cy="14" r="7" fill="#725640" />
          <circle cx="35" cy="14" r="7" fill="#725640" />
          <circle cx="12" cy="14" r="3" fill="#b29473" />
          <circle cx="35" cy="14" r="3" fill="#b29473" />
          <path d="m8 22 8-10 16 1 9 11-4 11-13 6-14-7z" fill="#98785a" />
          <ellipse cx="24" cy="31" rx="9" ry="7" fill="#d1b692" />
          <path d="m20 28 8-1-4 6z" fill="#443c32" />
          <circle cx="16" cy="23" r="2" fill="#37362f" />
          <circle cx="32" cy="23" r="2" fill="#37362f" />
        </>
      ) : animal === "owl" ? (
        <>
          <path d="m9 8 14 8L39 8l-2 12 4 12-17 10L8 33l3-14z" fill="#77617e" />
          <path
            d="m12 18 11 3-3 12-10-6zm24 0-11 3 3 12 10-6z"
            fill="#e6cea1"
          />
          <circle cx="17" cy="25" r="3" fill="#33343b" />
          <circle cx="31" cy="25" r="3" fill="#33343b" />
          <path d="m20 28 8-1-4 8z" fill="#df9a5f" />
        </>
      ) : (
        <>
          <path
            d="m13 22-3-18 6-1 7 17 4-18 6 1 1 19 4 11-14 10L9 32z"
            fill="#dfdbcb"
          />
          <path d="m14 7 4 2 3 12-4-1zm16-2 2 2-2 13-3 1z" fill="#dea9a3" />
          <circle cx="17" cy="27" r="2" fill="#48463e" />
          <circle cx="30" cy="27" r="2" fill="#48463e" />
          <path d="m20 32 7-1-3 5z" fill="#a2726b" />
        </>
      )}
    </svg>
  );
}
function Log({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0 22-12C29-14 35-1 29 4L7 17z" fill="#986549" />
      <path d="m0 1 23-12 4 2L5 6z" fill="#bf8e58" />
      <path d="m6 13 25-14-2 5L7 17z" fill="#694b3d" />
      <path d="m7 7 23-13m-19 17 18-10" stroke="#624a38" strokeWidth="1.3" />
      <ellipse
        cx="4"
        cy="9"
        rx="7"
        ry="9"
        transform="rotate(-28 4 9)"
        fill="#e5bd84"
      />
      <ellipse
        cx="4"
        cy="9"
        rx="4.3"
        ry="6"
        transform="rotate(-28 4 9)"
        fill="none"
        stroke="#a77c50"
        strokeWidth="1.3"
      />
      <path d="m3 8 3 4-1-4z" fill="#946b44" />
    </g>
  );
}
function Brick({ x, y, shade = false }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="m0 0 20-11 15 8L15 9z" fill={shade ? "#edaf87" : "#e69a78"} />
      <path d="m0 0 15 9v9L0 9z" fill="#bd6b56" />
      <path d="M15 9 35-3v9L15 18z" fill="#925342" />
      <path
        d="m2 1 13 7 18-10"
        fill="none"
        stroke="#f6c29a"
        strokeWidth="1.1"
      />
    </g>
  );
}
function Wheat({ x, y, angle = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <path d="M0 0q1-18 0-41" fill="none" stroke="#b88e45" strokeWidth="2.8" />
      <path d="M0-34q-5-6 0-14 5 7 0 14" fill="#f5d483" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(0 ${-6 * i})`}>
          <path d="M0-11q-9 0-9-11 9 2 9 11" fill="#dba752" />
          <path d="M0-12q1-9 10-12-1 11-10 12" fill="#f1c876" />
          <path d="m-8-21-3-6m20 4 3-6" stroke="#dcb367" strokeWidth="1" />
        </g>
      ))}
    </g>
  );
}
export function ResourceArt({ type, size = 58 }) {
  return (
    <svg
      className={`resource-art art-${type}`}
      viewBox="0 0 76 68"
      width={size}
      height={size * 0.9}
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="37" cy="56" rx="28" ry="7" fill="#0c151d" opacity=".32" />
      {type === "lumber" ? (
        <>
          <Log x={24} y={33} scale={1.1} />
          <Log x={15} y={38} scale={1.12} />
          <Log x={35} y={39} scale={1.08} />
          <Log x={22} y={22} scale={1.12} />
          <path d="m34 20 8-12 9-3-3 9z" fill="#6f9971" />
          <path d="m34 20 13-12" stroke="#45674c" strokeWidth="1.5" />
        </>
      ) : type === "brick" ? (
        <>
          <Brick x={23} y={29} />
          <Brick x={10} y={38} />
          <Brick x={28} y={43} shade />
          <Brick x={22} y={25} shade />
        </>
      ) : type === "wool" ? (
        <>
          <path
            d="m22 41-1 12 5 2 3-13zm18 5 2 11 5-1 1-14zm11-6 1 11 5-1-1-14"
            fill="#514b46"
          />
          <path d="m19 32-8-7-4 5 8 9z" fill="#c1bdac" />
          <g fill="#d6d6c3">
            <circle cx="24" cy="33" r="12" />
            <circle cx="36" cy="28" r="13" />
            <circle cx="47" cy="33" r="13" />
            <circle cx="36" cy="40" r="13" />
            <circle cx="24" cy="40" r="10" />
          </g>
          <g fill="#efefdc">
            <circle cx="26" cy="28" r="10" />
            <circle cx="39" cy="25" r="10" />
            <circle cx="48" cy="29" r="9" />
            <circle cx="33" cy="34" r="9" />
          </g>
          <path d="m48 33 7-5 10 7-4 12-9-1z" fill="#5b5e55" />
          <path d="m49 35-8 1-3-5 11-2zm11-2 6-6 4 2-6 9z" fill="#74776a" />
          <path d="m48 29 4-6 9 3 2 6-9 3z" fill="#e6e7d4" />
          <circle cx="59" cy="36" r="1.8" fill="#292f2c" />
          <path d="m29 45-2 13-5-1 2-13z" fill="#686357" />
        </>
      ) : type === "grain" ? (
        <>
          <Wheat x={35} y={59} angle={-28} scale={0.89} />
          <Wheat x={36} y={58} angle={7} scale={1.08} />
          <Wheat x={37} y={59} angle={32} scale={0.86} />
          <path d="m26 43 19 5-2 4-18-6z" fill="#a77d4a" />
          <path d="m28 45 14 4" stroke="#e2bd77" strokeWidth="1.8" />
        </>
      ) : (
        <>
          <path d="m11 40 6-19 17-9 12 13-5 24-18 6z" fill="#9fabbf" />
          <path d="m17 21 17-9-4 21-19 7z" fill="#c2c8d0" />
          <path d="m30 33 4-21 12 13-5 24z" fill="#74849b" />
          <path d="m30 33 11 16-18 6-12-15z" fill="#8c99ac" />
          <path d="m36 37 9-14 13 1 10 18-6 10-16 3-13-9z" fill="#a2abc0" />
          <path d="m45 23 13 1-5 15-17-2z" fill="#c6cad6" />
          <path d="m53 39 5-15 10 18-6 10z" fill="#76859a" />
          <path d="m23 50 4-10 14-4 10 13-7 10-13 1z" fill="#abb6c7" />
          <path d="m27 40 14-4-3 14-15 0z" fill="#d0d4da" />
          <path d="m38 50 3-14 10 13-7 10z" fill="#8794a7" />
        </>
      )}
    </svg>
  );
}
export function HexPattern() {
  const id = useId();
  return (
    <svg
      className="hex-pattern"
      width="180"
      height="110"
      viewBox="0 0 180 110"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={id}
          width="38"
          height="65.818"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="m0 0 19 10.97V32.9L0 43.88-19 32.9V10.97zm38 0 19 10.97V32.9L38 43.88 19 32.9V10.97zm-19 32.9 19 10.98v21.94L19 76.79 0 65.82V43.88z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
