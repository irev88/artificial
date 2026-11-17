# Colonist — Game Lobby

An illustrated, multiplayer settlement game for 2–4 friends. Create a private table, share its six-character code or invite link, and play on a shared hex island. No account, external game service, or API key is required. This is an independent game, not an integration with Colonist.io.

## Run locally

Use Node.js 22 or later.

```sh
npm ci
npm run dev
```

Open the URL Vite prints. The frontend and room API share a port. To invite someone on another device, open the site using a host they can reach (a shared preview, LAN address, or deployed URL) before copying the invite link.

## Game night

1. **Create room:** choose your name, room name, 2–4 seats, and a victory target of 6, 8, or 10 points.
2. **Invite friends:** use **Invite friends → Copy invite link**, or copy the room code. Guests can also enter that code in the lobby. Add bots to fill empty seats if you like.
3. **Start game:** the host can start with at least two seats occupied. Each player begins with two placed settlements and two roads.
4. **Play:** roll dice to produce resources, build roads and settlements, upgrade cities, and trade. The bank exchanges at 4:1; players can offer 1:1 trades. A seven moves the robber, blocking production and taking a card from an eligible opponent. First to the room’s target wins. The field guide lists build costs and placement rules.

Room chat, scores, turns, and board changes synchronize between browsers. Refreshing the same tab preserves your seat. Returning to the lobby keeps the room open; **Leave room** explicitly gives up your seat. If the host leaves, another human becomes host. During a game a bot takes over a departing player’s pieces.

## Production

```sh
npm run build
npm start
```

The Node server serves the built site, invite routes, and `/api` on `0.0.0.0:3000` (`PORT` overrides the port). Deploy **one long-running Node instance**, with HTTPS and a writable persistent volume. A static-only file host cannot run multiplayer rooms.

Room state is saved atomically in `.data/rooms.json`. Set `ROOM_DATA_DIR` to use another private directory outside the public assets. Rooms expire after 24 hours without an action. Creating or joining a room automatically issues a private player session. The browser sends it in same-origin JSON requests (including read-only room polls), so gameplay does not depend on cookies or the proxy forwarding an authorization header. Invite links contain only the room code. The server stores only the session hash, and each player receives only their own resource hand.

## Verification

```sh
npm test
npm run build
```

Tests cover room creation and invitations, capacity, host permissions and transfer, chat, private views, reconnects, persistence, legal placement, trades, robber moves, turns, bots, and victory conditions.

## Structure

- `src/` — React UI, illustrations, responsive styles, and same-origin API client.
- `shared/island.mjs` — board geometry, resources, prices, and build-site rules shared by UI and server.
- `server/game.mjs` — authoritative dice, production, trade, building, and bot logic.
- `server/api.mjs` — room membership, game actions, persistence, and per-player state views.
- `server/start.mjs` — production server. Vite mounts the same API during development and preview.
- `public/assets/` — locally hosted island artwork. Fonts are bundled with the app.
