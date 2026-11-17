import { isSessionToken } from "../shared/session.mjs";

export function createRoomClient({
  readSession,
  writeSession,
  request = fetch,
  baseUrl = "/api",
}) {
  const saved = readSession();
  let token = isSessionToken(saved) ? saved : null;

  async function api(path, body) {
    const post = body !== undefined;
    let res;
    try {
      // Preview proxies can reserve Authorization for their own use. Keep the
      // seat credential in the same-origin JSON payload, never in an invite URL.
      res = await request(baseUrl + path, {
        method: post ? "POST" : "GET",
        headers: post ? { "Content-Type": "application/json" } : {},
        body: post
          ? JSON.stringify({ ...body, sessionToken: token })
          : undefined,
        signal: globalThis.AbortSignal?.timeout?.(12000),
        cache: "no-store",
      });
    } catch {
      throw new Error(
        "Could not reach the island. Check your connection and try again.",
      );
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      const error = new Error(
        data?.error || "Could not load the game. Please try again.",
      );
      error.status = res.status;
      throw error;
    }
    if (Object.hasOwn(data, "sessionToken")) {
      // Only first-time create/join responses issue a token. Save it before
      // exposing the room to React so even its very first poll knows our seat.
      const { sessionToken, ...room } = data;
      if (!isSessionToken(sessionToken))
        throw new Error("Could not open a player session. Please try again.");
      token = sessionToken;
      writeSession(token);
      return room;
    }
    return data;
  }
  return {
    api,
    readRoom: (code) => api(`/rooms/${encodeURIComponent(code)}/state`, {}),
  };
}
