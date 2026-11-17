import React, { useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Flag,
  Ticket,
  UsersRound,
  Clock3,
  Layers3,
  LockKeyhole,
  MapPin,
  Hash,
  Plus,
  LoaderCircle,
  Info,
} from "lucide-react";
import { RESOURCES, cap } from "../../shared/island.mjs";
import { readRoom, RES_INFO } from "../lib.js";
import { ResourceArt, HexPattern } from "./Art.jsx";

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div
        className="hero-picture"
        role="img"
        aria-label="An illustrated hex-tile island with pine forests, golden fields, tiny settlements and mountain peaks"
      />
      <div className="hero-content">
        <div className="hero-kicker">
          <span className="little-diamond" />
          THE SETTLERS’ LOBBY
        </div>
        <h1 id="hero-title">
          Build. Trade. <span>Settle.</span>
        </h1>
        <p>
          Gather your friends and carve out your own
          <br className="desktop-br" /> corner of the island.
        </p>
        <div className="hero-facts">
          <span>
            <UsersRound />
            2–4 players
          </span>
          <i />
          <span>
            <Clock3 />
            30–60 min
          </span>
          <i />
          <span>
            <Layers3 />
            Strategy
          </span>
        </div>
      </div>
      <div className="map-tag">
        <MapPin size={12} />
        <span>Evergreen Isle</span>
      </div>
    </section>
  );
}
export default function Lobby({
  onCreate,
  onJoin,
  onGuide,
  currentRoom,
  resume,
}) {
  const [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const input = useRef(null);
  async function findRoom(e) {
    e.preventDefault();
    if (busy) return;
    if (code.length !== 6) {
      setError("Enter the six-character code from your host.");
      input.current?.focus();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const room = await readRoom(code);
      if (
        !room.isMember &&
        (room.status !== "waiting" || room.count >= room.limit)
      )
        throw new Error(
          room.status !== "waiting"
            ? "This game is already in progress."
            : "This room is full. Ask your host to open a seat.",
        );
      onJoin(room);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="container home">
      <Hero />
      {currentRoom && (
        <div className="resume-banner">
          <span>
            <span className="status-dot" />
            Your seat at <strong>{currentRoom.name}</strong> is saved.
          </span>
          <button className="text-button" onClick={resume}>
            Return to room <ArrowRight size={15} />
          </button>
        </div>
      )}
      <section className="play-section" aria-labelledby="play-heading">
        <div className="section-head">
          <h2 id="play-heading">Play with friends</h2>
          <span className="private-note">
            <LockKeyhole size={13} />
            Private rooms
          </span>
        </div>
        <div className="action-grid">
          <article className="action-card host-card">
            <HexPattern />
            <div className="action-top">
              <div className="action-icon host-icon">
                <Flag size={24} strokeWidth={1.75} />
              </div>
              <span className="eyebrow">HOST A GAME</span>
            </div>
            <h3>Create a room</h3>
            <p>Start a fresh game and invite your friends to the table.</p>
            <button className="btn btn-gold create-cta" onClick={onCreate}>
              <Plus size={18} strokeWidth={2.5} />
              Create room <ArrowRight className="cta-arrow" size={17} />
            </button>
          </article>
          <article className="action-card join-card">
            <HexPattern />
            <div className="action-top">
              <div className="action-icon join-icon">
                <Ticket size={25} strokeWidth={1.75} />
              </div>
              <span className="eyebrow">HAVE AN INVITE?</span>
            </div>
            <h3>Join a room</h3>
            <p>Enter a room code to pull up a seat with your crew.</p>
            <form className="join-form" onSubmit={findRoom}>
              <div className={"code-input " + (error ? "invalid" : "")}>
                <Hash size={17} />
                <input
                  ref={input}
                  aria-label="Room code"
                  aria-invalid={!!error}
                  aria-describedby={error ? "code-error" : undefined}
                  placeholder="Enter room code"
                  spellCheck="false"
                  autoComplete="off"
                  autoCapitalize="characters"
                  value={code}
                  onChange={(e) => {
                    setCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6),
                    );
                    setError("");
                  }}
                />
              </div>
              <button className="btn btn-sea" disabled={busy} type="submit">
                {busy ? (
                  <LoaderCircle size={17} className="spin" />
                ) : (
                  <>
                    Join room
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
            {error && (
              <p role="alert" id="code-error" className="inline-error">
                <Info size={14} />
                {error}
              </p>
            )}
          </article>
        </div>
      </section>
      <section className="resource-section" aria-labelledby="resource-heading">
        <div className="section-head resource-head">
          <div className="resource-title">
            <span className="section-symbol">
              <Layers3 size={19} />
            </span>
            <h2 id="resource-heading">Island resources</h2>
          </div>
          <button className="guide-link" onClick={() => onGuide("resources")}>
            Resource guide
            <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="resource-grid">
          {RESOURCES.map((r) => (
            <button
              className="resource-card"
              key={r}
              onClick={() => onGuide("resources", r)}
              style={{
                "--resource-color": RES_INFO[r].color,
                "--resource-tint": RES_INFO[r].tint,
              }}
            >
              <ResourceArt type={r} />
              <span>
                <strong>{cap(r)}</strong>
                <small>{RES_INFO[r].land}</small>
              </span>
              <ArrowUpRight size={14} className="resource-open" />
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
