import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  BookOpen,
  Castle,
  Check,
  ChevronDown,
  ChevronRight,
  Dices,
  Flag,
  History,
  House,
  Layers3,
  MapPin,
  RotateCcw,
  Route,
  Shield,
  Trophy,
  X,
} from "lucide-react";
import {
  COLORS,
  PRICES,
  RESOURCES,
  affordable,
  cap,
  targets,
} from "../../shared/island.mjs";

import { Avatar, ResourceArt } from "./Art.jsx";
import { Chat, RoomTrail } from "./Room.jsx";
import { Modal } from "./Dialogs.jsx";
import Board from "./Board.jsx";

function Die({ n }) {
  const ps = [
    [],
    [[10, 10]],
    [
      [5, 5],
      [15, 15],
    ],
    [
      [5, 5],
      [10, 10],
      [15, 15],
    ],
    [
      [5, 5],
      [15, 5],
      [5, 15],
      [15, 15],
    ],
    [
      [5, 5],
      [15, 5],
      [10, 10],
      [5, 15],
      [15, 15],
    ],
    [
      [5, 5],
      [15, 5],
      [5, 10],
      [15, 10],
      [5, 15],
      [15, 15],
    ],
  ][n];
  return (
    <svg viewBox="0 0 20 20" width="22" height="22" aria-label={`${n}`}>
      <rect x=".7" y=".7" width="18.6" height="18.6" rx="4" fill="#e9ddc3" />
      {ps.map(([x, y], i) => (
        <circle cx={x} cy={y} r="1.65" key={i} fill="#3b4545" />
      ))}
    </svg>
  );
}
function TradeDialog({ room, action, busy, onClose }) {
  const [partner, setPartner] = useState("bank"),
    [give, setGive] = useState(
      RESOURCES.reduce((a, b) =>
        room.game.hand[a] >= room.game.hand[b] ? a : b,
      ),
    ),
    [get, setGet] = useState(RESOURCES.find((r) => r !== give));
  const amount = partner === "bank" ? 4 : 1,
    valid = give !== get && room.game.hand[give] >= amount;
  return (
    <Modal
      title="Trade resources"
      eyebrow="THE TRADING TABLE"
      icon={ArrowRightLeft}
      onClose={onClose}
    >
      <p className="dialog-intro">
        Trade with the bank or offer a swap to another settler.
      </p>
      <div className="guide-tabs">
        <button
          aria-pressed={partner === "bank"}
          onClick={() => setPartner("bank")}
        >
          Bank · 4:1
        </button>
        <button
          aria-pressed={partner === "table"}
          onClick={() => setPartner("table")}
        >
          Table · 1:1
        </button>
      </div>
      <form
        className="dialog-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            valid &&
            (await action("play", { type: "trade", give, get, partner }))
          )
            onClose();
        }}
      >
        <div className="trade-inputs">
          <label>
            You give · {amount}
            <select value={give} onChange={(e) => setGive(e.target.value)}>
              {RESOURCES.map((r) => (
                <option key={r} value={r}>
                  {cap(r)} ({room.game.hand[r]})
                </option>
              ))}
            </select>
          </label>
          <ArrowRight size={17} />
          <label>
            You receive · 1
            <select value={get} onChange={(e) => setGet(e.target.value)}>
              {RESOURCES.map((r) => (
                <option key={r} value={r}>
                  {cap(r)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="form-note">
          {give === get
            ? "Choose two different resources."
            : room.game.hand[give] < amount
              ? `You need ${amount} ${give} for this trade.`
              : partner === "bank"
                ? "The bank will complete this trade immediately."
                : "Your offer stays open until it is accepted or your turn ends."}
        </p>
        <button className="btn btn-gold" disabled={!valid || busy}>
          <ArrowRightLeft size={16} />
          {partner === "bank" ? "Trade with bank" : "Offer trade"}
        </button>
      </form>
    </Modal>
  );
}
export default function Game({
  room,
  action,
  busy,
  onLobby,
  onLeave,
  onGuide,
}) {
  const g = room.game,
    turn = room.players[g.turn],
    me = room.players.find((p) => p.id === room.you),
    won = room.status === "finished",
    mine = turn.id === me.id && !won,
    buildPhase = mine && g.phase === "build";
  const [build, setBuild] = useState(""),
    [trade, setTrade] = useState(false);
  useEffect(() => {
    if (!buildPhase) {
      setBuild("");
      setTrade(false);
    }
  }, [buildPhase]);
  const mode =
      mine && g.phase === "robber" ? "robber" : buildPhase ? build : "",
    sites = build ? targets(g, me.id, build) : [];
  const boardRef = useRef(null);
  useEffect(() => {
    if (mode && window.matchMedia("(max-width: 650px)").matches) {
      boardRef.current?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    }
  }, [mode]);
  const play = (data) => action("play", data);
  const choose = async (site) => {
    const ok = await play(
      mode === "robber"
        ? { type: "robber", tile: site }
        : { type: "build", site, kind: mode },
    );
    if (ok) setBuild("");
  };
  return (
    <main className="container game-page">
      <RoomTrail
        onLeave={onLeave}
        onLobby={onLobby}
        text={won ? "Completed game" : "Game in progress"}
      />
      <div className="game-heading">
        <div>
          <div className="eyebrow">
            <Flag size={13} />
            THE GAME TABLE
          </div>
          <h1>{room.name}</h1>
        </div>
        <span className="counter-pill">
          <Trophy size={14} />
          First to {room.goal}
        </span>
      </div>
      {won && (
        <section className="win-panel">
          <Trophy size={34} />
          <div>
            <span className="eyebrow">ISLAND VICTORY</span>
            <h2>
              {g.winner === me.id
                ? "You won the island!"
                : `${room.players.find((p) => p.id === g.winner)?.name} won the island!`}
            </h2>
          </div>
          {room.host === me.id ? (
            <button
              className="btn btn-gold"
              disabled={busy}
              onClick={() => action("again")}
            >
              <RotateCcw size={16} />
              Play again
            </button>
          ) : (
            <span>Waiting for the host to start a new table.</span>
          )}
        </section>
      )}
      <div className="game-layout">
        <div className="board-column">
          <section className="board-panel" ref={boardRef}>
            <div className="board-label">
              <span>
                <MapPin size={14} />
                Evergreen Isle
              </span>
              <b>ROUND {String(g.round).padStart(2, "0")}</b>
            </div>
            <Board
              room={room}
              mode={mode}
              sites={sites}
              choose={choose}
              busy={busy}
            />
            <div className={"board-help " + (mode ? "active" : "")}>
              <span>
                {mode === "robber" ? (
                  <>
                    <Shield size={15} />
                    Choose a different tile for the robber.
                  </>
                ) : mode ? (
                  <>
                    <MapPin size={15} />
                    Select a highlighted site for your {mode}.
                  </>
                ) : (
                  <>
                    <Layers3 size={15} />
                    Your pieces are <i style={{ background: me.color }} />
                    {
                      ["amber", "teal", "violet", "coral"][
                        COLORS.indexOf(me.color)
                      ]
                    }
                    .
                  </>
                )}
              </span>
              {build && (
                <button className="text-button" onClick={() => setBuild("")}>
                  Cancel
                  <X size={14} />
                </button>
              )}
            </div>
          </section>
          <section className="panel hand-panel">
            <div className="panel-title">
              <h3>Your resources</h3>
              <span className="quiet-tag">{me.cards} CARDS</span>
            </div>
            <div className="hand">
              {RESOURCES.map((r) => (
                <div key={r}>
                  <ResourceArt type={r} size={43} />
                  <strong>{g.hand[r]}</strong>
                  <small>{cap(r)}</small>
                </div>
              ))}
            </div>
          </section>
          <details className="panel game-log" open>
            <summary>
              <span>
                <History size={17} />
                Island log
              </span>
              <ChevronDown size={15} />
            </summary>
            <ol>
              {g.log
                .slice(-6)
                .reverse()
                .map((l) => (
                  <li key={l.id}>{l.text}</li>
                ))}
            </ol>
          </details>
        </div>
        <aside className="game-sidebar">
          <section className="panel turn-panel">
            <div className="eyebrow">
              <span className="status-dot" />
              {won ? "GAME COMPLETE" : mine ? "YOUR TURN" : "AT THE TABLE"}
            </div>
            <h2>
              {won
                ? "Well played."
                : mine
                  ? g.phase === "roll"
                    ? "Roll the dice."
                    : g.phase === "robber"
                      ? "Move the robber."
                      : "Make your move."
                  : `${turn.name}’s turn`}
            </h2>
            <p>
              {won
                ? "Your island has a winner."
                : !mine
                  ? "Your resources still grow on other settlers’ rolls."
                  : g.phase === "roll"
                    ? "Let the island decide the harvest."
                    : g.phase === "robber"
                      ? "Choose a tile to block its next harvest."
                      : "Build, trade, or pass the dice."}
            </p>
            {g.dice && (
              <div className="dice-result">
                <Die n={g.dice[0]} />
                <Die n={g.dice[1]} />
                <span>
                  Last roll <strong>{g.dice[0] + g.dice[1]}</strong>
                </span>
              </div>
            )}
            {mine && g.phase === "roll" && (
              <button
                className="btn btn-gold wide-btn"
                disabled={busy}
                onClick={() => play({ type: "roll" })}
              >
                <Dices size={19} />
                Roll dice
              </button>
            )}
            {buildPhase && (
              <div className="build-actions">
                {[
                  ["road", Route],
                  ["settlement", House],
                  ["city", Castle],
                ].map(([k, Icon]) => {
                  const has = affordable(g.hand, PRICES[k]),
                    where = targets(g, me.id, k);
                  return (
                    <button
                      key={k}
                      className={
                        "build-option " + (build === k ? "selected" : "")
                      }
                      title={
                        !has
                          ? "Not enough resources"
                          : !where.length
                            ? "No connected sites available"
                            : "Choose a site on the board"
                      }
                      disabled={busy || !has || !where.length}
                      onClick={() => setBuild(build === k ? "" : k)}
                    >
                      <Icon size={18} />
                      <span>
                        <strong>
                          Build{" "}
                          {k === "road"
                            ? "a road"
                            : k === "city"
                              ? "a city"
                              : "a settlement"}
                        </strong>
                        <small>
                          {Object.entries(PRICES[k])
                            .map(([r, n]) => `${n} ${r}`)
                            .join(" · ")}
                        </small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  );
                })}
                <div className="turn-buttons">
                  <button
                    className="btn btn-muted"
                    disabled={busy}
                    onClick={() => setTrade(true)}
                  >
                    <ArrowRightLeft size={16} />
                    Trade
                  </button>
                  <button
                    className="btn btn-gold"
                    disabled={busy}
                    onClick={() => play({ type: "end" })}
                  >
                    End turn
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
            {g.offer && (
              <div className="offer">
                <span className="eyebrow">TABLE OFFER</span>
                <p>
                  {g.offer.from === me.id
                    ? "You offer"
                    : `${room.players.find((p) => p.id === g.offer.from)?.name} offers`}{" "}
                  <strong>1 {g.offer.give}</strong> for{" "}
                  <strong>1 {g.offer.get}</strong>.
                </p>
                {g.offer.from === me.id ? (
                  <button
                    className="small-button"
                    disabled={busy}
                    onClick={() => play({ type: "cancelOffer" })}
                  >
                    Cancel offer
                  </button>
                ) : (
                  <button
                    className="small-button"
                    disabled={busy || !g.hand[g.offer.get]}
                    onClick={() => play({ type: "accept" })}
                  >
                    <Check size={14} />
                    Accept trade
                  </button>
                )}
              </div>
            )}
          </section>
          <section className="panel score-panel">
            <div className="panel-title">
              <h3>
                <Trophy size={17} />
                Scoreboard
              </h3>
            </div>
            {room.players.map((p) => (
              <div key={p.id} className="score-entry">
                <i style={{ background: p.color }} />
                <Avatar animal={p.avatar} size={31} />
                <strong>
                  {p.name}
                  {p.id === room.you && <small> (you)</small>}
                </strong>
                <span>
                  {p.points}
                  <small> VP</small>
                </span>
              </div>
            ))}
          </section>
          <Chat room={room} action={action} busy={busy} />
          <button
            className="guide-link mid-link"
            onClick={() => onGuide("building")}
          >
            <BookOpen size={15} />
            Building reference
            <ChevronRight size={14} />
          </button>
        </aside>
      </div>
      {trade && buildPhase && (
        <TradeDialog
          room={room}
          action={action}
          busy={busy}
          onClose={() => setTrade(false)}
        />
      )}
    </main>
  );
}
