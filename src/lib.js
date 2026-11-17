import { createRoomClient } from "./room-client.js";

export function readStore(key, fallback, session = false) {
  const field = `colonist.${key}`;
  try {
    const val = (session ? sessionStorage : localStorage).getItem(field);
    if (val !== null) return JSON.parse(val);
  } catch {
    // Storage can be disabled in an embedded preview.
  }
  try {
    return session
      ? (globalThis.history?.state?.[field] ?? fallback)
      : fallback;
  } catch {
    return fallback;
  }
}
export function store(key, value, session = false) {
  const field = `colonist.${key}`;
  try {
    (session ? sessionStorage : localStorage).setItem(
      field,
      JSON.stringify(value),
    );
    return;
  } catch {
    // The client keeps the active session in memory regardless of persistence.
  }
  if (session) {
    try {
      // Tab-local navigation state survives a reload without a cookie or a URL token.
      if (history.state?.[field] !== value)
        history.replaceState({ ...history.state, [field]: value }, "");
    } catch {
      // If history is restricted too, the current page can still play normally.
    }
  }
}
export const { api, readRoom } = createRoomClient({
  baseUrl: import.meta.env?.VITE_PUBLIC_ROOM_API || "/api",
  readSession: () => readStore("session", null, true),
  writeSession: (value) => store("session", value, true),
});
export const publicLobby = "https://irev88.github.io/artificial/";
export function roomPath(code) {
  if (import.meta.env?.VITE_PUBLIC_ROOM_API) return import.meta.env.BASE_URL + (code ? "?room=" + encodeURIComponent(code) : "");
  return code ? "/room/"+code : "/";
}
export function codeFromPath() {
  const c = new URLSearchParams(location.search).get("room") || location.pathname.match(/\/room\/([A-Z0-9]{6})\/?$/i)?.[1] || "";
  return /^[A-Z0-9]{6}$/i.test(c) ? c.toUpperCase() : "";
}
export const inviteUrl = code => new URL(roomPath(code), location.origin).href;
export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    (document.querySelector("dialog[open]") || document.body).append(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
}
export const RES_INFO = {
  lumber: {
    land: "Forest",
    color: "#79be8b",
    tint: "#202e2c",
    use: "Roads & settlements",
    text: "Tall forests supply lumber. Pair it with brick to lay a road, or save some to build a new settlement.",
  },
  brick: {
    land: "Hills",
    color: "#dc947a",
    tint: "#312a2b",
    use: "Roads & settlements",
    text: "The clay hills produce brick. It is the foundation of every new road and settlement on your island.",
  },
  wool: {
    land: "Pasture",
    color: "#b7cd90",
    tint: "#29312c",
    use: "Settlements",
    text: "Sheep graze the green pastures, providing wool. Keep one on hand for your next settlement.",
  },
  grain: {
    land: "Fields",
    color: "#e3bc69",
    tint: "#302e26",
    use: "Settlements & cities",
    text: "Golden fields grow grain. Spend one on a settlement, or combine two grain with three ore to build a city.",
  },
  ore: {
    land: "Mountains",
    color: "#a8aacb",
    tint: "#2a2b35",
    use: "Cities",
    text: "The mountains hold ore. Collect three, along with two grain, to upgrade a settlement into a productive city.",
  },
};
