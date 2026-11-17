import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Check,
  ChevronRight,
  Copy,
  Crown,
  Link,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Play,
  Plus,
  Send,
  Trash2,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Avatar, HexPattern } from "./Art.jsx";

export function RoomTrail({ onLobby, onLeave, text = "Private room" }) {
  return (
    <div className="room-trail">
      <div>
        <button className="text-button" onClick={onLobby}>
          Lobby
        </button>
        <ChevronRight size={14} />
        <span>{text}</span>
      </div>
      <button className="text-button leave-text" onClick={onLeave}>
        <LogOut size={14} />
        Leave room
      </button>
    </div>
  );
}
export function Chat({ room, action, busy }) {
  const [text, setText] = useState("");
  const box = useRef(null);
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [room.messages.length, room.messages.at(-1)?.id]);
  async function send(e) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    const ok = await action("chat", { text: text.trim() });
    if (ok) setText("");
  }
  return (
    <section className="panel chat-panel">
      <div className="panel-title">
        <h3>
          <MessageCircle size={18} />
          Table chat
        </h3>
        <span className="quiet-tag">ROOM ONLY</span>
      </div>
      <div
        className="messages"
        ref={box}
        role="log"
        aria-label="Table chat"
        aria-live="polite"
      >
        {room.messages.length ? (
          room.messages.map((m) => (
            <p key={m.id}>
              <strong
                style={{
                  color: room.players.find((p) => p.id === m.who)?.color,
                }}
              >
                {m.who === room.you ? "You" : m.name}
              </strong>
              <span>{m.text}</span>
            </p>
          ))
        ) : (
          <div className="chat-empty">
            <MessageCircle size={21} />
            <span>
              The table is quiet.
              <br />
              Say hello to your fellow settlers.
            </span>
          </div>
        )}
      </div>
      <form className="chat-form" onSubmit={send}>
        <input
          aria-label="Chat message"
          placeholder="Message your table…"
          maxLength={320}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="icon-button"
          disabled={busy || !text.trim()}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </section>
  );
}
export default function Room({
  room,
  action,
  busy,
  onInvite,
  onCopy,
  onLeave,
  onLobby,
}) {
  const isHost = room.host === room.you;
  const [copied, setCopied] = useState(false);
  return (
    <main className="container room-page">
      <RoomTrail onLobby={onLobby} onLeave={onLeave} />
      <section className="room-banner">
        <div className="room-banner-art" />
        <div className="room-banner-content">
          <div className="hero-kicker">
            <span className="status-dot" />
            WAITING ROOM
          </div>
          <h1>{room.name}</h1>
          <div className="hero-facts">
            <span>
              <UsersRound />
              {room.limit} seats
            </span>
            <i />
            <span>
              <Trophy />
              {room.goal} victory points
            </span>
            <i />
            <span>
              <LockKeyhole />
              Private
            </span>
          </div>
        </div>
      </section>
      <div className="room-layout">
        <section className="panel seat-panel">
          <div className="panel-title">
            <h2>At the table</h2>
            <span className="counter-pill">
              <UsersRound size={14} />
              {room.count} / {room.limit}
            </span>
          </div>
          <p className="panel-desc">
            {isHost
              ? "Your island is ready. Gather your crew to get started."
              : "Your seat is saved. The host will start the game."}
          </p>
          <div className="seat-list">
            {room.players.map((p) => (
              <div className="seat" key={p.id}>
                <span className="seat-color" style={{ background: p.color }} />
                <Avatar size={41} animal={p.avatar} />
                <div className="seat-name">
                  <strong>
                    {p.name}
                    {p.id === room.you && <small> (you)</small>}
                  </strong>
                  <span>
                    {p.isBot
                      ? "Island bot"
                      : p.id === room.host
                        ? "Room host"
                        : "Settler"}
                  </span>
                </div>
                {p.id === room.host ? (
                  <span className="host-badge">
                    <Crown size={13} />
                    HOST
                  </span>
                ) : p.isBot ? (
                  isHost ? (
                    <button
                      className="icon-button remove-bot"
                      aria-label={"Remove " + p.name}
                      title="Remove bot"
                      disabled={busy}
                      onClick={() => action("removeBot", { id: p.id })}
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <Bot size={17} />
                  )
                ) : (
                  <span className="ready-dot">
                    <Check size={13} />
                    Joined
                  </span>
                )}
              </div>
            ))}
            {Array.from({ length: room.limit - room.count }, (_, i) => (
              <div className="seat open-seat" key={"empty" + i}>
                <div className="empty-avatar">
                  <UserRound size={20} />
                </div>
                <div className="seat-name">
                  <strong>Open seat</strong>
                  <span>Waiting for a settler</span>
                </div>
                {isHost && (
                  <button
                    className="small-button add-bot"
                    disabled={busy}
                    onClick={() => action("bot")}
                  >
                    <Plus size={14} />
                    Add bot
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="start-area">
            {isHost ? (
              <>
                <button
                  className="btn btn-gold wide-btn"
                  disabled={busy || room.count < 2}
                  onClick={() => action("start")}
                >
                  <Play size={16} fill="currentColor" />
                  Start game
                </button>
                <span>
                  {room.count < 2
                    ? "Invite a friend or add a bot to start."
                    : "Everyone at the table will enter the game together."}
                </span>
              </>
            ) : (
              <div className="waiting-note">
                <span className="status-dot" />
                Waiting for the host to start…
              </div>
            )}
          </div>
        </section>
        <aside className="room-aside">
          <section className="panel invite-panel">
            <HexPattern />
            <div className="eyebrow">
              <LockKeyhole size={13} />
              PRIVATE INVITE
            </div>
            <h2>Make room for friends.</h2>
            <p>Share the code or send a link to your table.</p>
            <div className="room-code-display">
              <span>{room.code}</span>
              <button
                className="icon-button"
                aria-label="Copy room code"
                onClick={async () => {
                  if (await onCopy(room.code, "Room code copied"))
                    setCopied(true);
                }}
              >
                {copied ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>
            <button className="btn btn-sea wide-btn" onClick={onInvite}>
              <Link size={16} />
              Invite friends
            </button>
          </section>
          <Chat room={room} action={action} busy={busy} />
        </aside>
      </div>
    </main>
  );
}
