import React, { useEffect, useId, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Castle,
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  Dices,
  Flag,
  HandCoins,
  House,
  Layers3,
  Link,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Plus,
  Route,
  Ticket,
  Trophy,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { ANIMALS, PRICES, RESOURCES, cap } from "../../shared/island.mjs";
import { inviteUrl, RES_INFO } from "../lib.js";
import { Avatar, ResourceArt } from "./Art.jsx";

export function Modal({
  title,
  eyebrow,
  icon: Icon,
  tint = "",
  onClose,
  children,
  wide = false,
}) {
  const ref = useRef(null),
    id = useId();
  useEffect(() => {
    const d = ref.current,
      prev = document.body.style.overflow;
    d.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      d.close();
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <dialog
      className={"modal " + (wide ? "modal-wide " : "") + tint}
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-top">
        <div className="modal-icon">{Icon && <Icon size={23} />}</div>
        <button
          className="icon-button close-modal"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      <div className="eyebrow modal-eyebrow">{eyebrow}</div>
      <h2 id={id}>{title}</h2>
      {children}
    </dialog>
  );
}
export function ErrorLine({ error }) {
  return error ? (
    <p className="form-error" role="alert">
      <CircleAlert size={16} />
      {error}
    </p>
  ) : null;
}
export function CreateDialog({ profile, onClose, submit }) {
  const [name, setName] = useState(profile.name),
    [roomName, setRoomName] = useState("Evergreen Table"),
    [limit, setLimit] = useState(4),
    [goal, setGoal] = useState(8),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function create(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await submit({
        name: name.trim(),
        avatar: profile.avatar,
        roomName: roomName.trim(),
        limit,
        goal,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Create a room"
      eyebrow="HOST A GAME"
      icon={Flag}
      onClose={onClose}
    >
      <p className="dialog-intro">
        Set your table. We’ll give you a private invite to share.
      </p>
      <form className="dialog-form" onSubmit={create}>
        <label>
          Room name
          <input
            required
            maxLength={40}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Name your island"
          />
        </label>
        <label>
          Your settler name
          <input
            required
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="nickname"
          />
        </label>
        <fieldset>
          <legend>Seats at the table</legend>
          <div className="choice-row">
            {[2, 3, 4].map((n) => (
              <label
                className={"choice " + (limit === n ? "selected" : "")}
                key={n}
              >
                <input
                  type="radio"
                  name="seats"
                  checked={limit === n}
                  onChange={() => setLimit(n)}
                />
                <UsersRound size={15} />
                {n} players
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          Victory target
          <div className="select-wrap">
            <select value={goal} onChange={(e) => setGoal(+e.target.value)}>
              <option value={6}>6 points · Short game</option>
              <option value={8}>8 points · Standard game</option>
              <option value={10}>10 points · Long game</option>
            </select>
            <ChevronDown size={16} />
          </div>
        </label>
        <ErrorLine error={error} />
        <button className="btn btn-gold wide-btn" disabled={busy}>
          {busy ? (
            <LoaderCircle size={17} className="spin" />
          ) : (
            <Plus size={18} />
          )}{" "}
          {busy ? "Creating room…" : "Create room"}
        </button>
        <div className="form-footnote">
          <LockKeyhole size={12} />
          Only people with your link or code can join.
        </div>
      </form>
    </Modal>
  );
}
export function JoinForm({ profile, room, submit, onCancel }) {
  const [name, setName] = useState(profile.name),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function join(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await submit(room.code, { name: name.trim(), avatar: profile.avatar });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const unavailable =
    room.status !== "waiting"
      ? "This game has already started."
      : room.count >= room.limit
        ? "All seats are taken. Ask your host to open a seat."
        : "";
  return (
    <form className="dialog-form join-dialog-form" onSubmit={join}>
      <div className="invite-room-summary">
        <div className="summary-flag">
          <Flag size={24} />
        </div>
        <div>
          <strong>{room.name}</strong>
          <span>
            {room.count}/{room.limit} players <b>·</b> {room.goal} victory
            points
          </span>
        </div>
        <span className="small-code">{room.code}</span>
      </div>
      <label>
        Your settler name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          required
          autoComplete="nickname"
        />
      </label>
      <ErrorLine error={error || unavailable} />
      <button
        className="btn btn-gold wide-btn"
        disabled={busy || !!unavailable}
      >
        {busy ? (
          <LoaderCircle className="spin" size={16} />
        ) : (
          <Ticket size={18} />
        )}{" "}
        {busy ? "Joining…" : "Join room"}
      </button>
      {onCancel && (
        <button
          className="text-button center-button"
          type="button"
          onClick={onCancel}
        >
          Back to lobby
        </button>
      )}
    </form>
  );
}
export function JoinDialog({ profile, room, onClose, submit }) {
  return (
    <Modal
      title="Pull up a seat."
      eyebrow="JOIN A PRIVATE ROOM"
      icon={Ticket}
      tint="teal"
      onClose={onClose}
    >
      <p className="dialog-intro">
        Choose the name your friends will see at the table.
      </p>
      <JoinForm profile={profile} room={room} submit={submit} />
    </Modal>
  );
}
export function ProfileDialog({ profile, submit, onClose }) {
  const [name, setName] = useState(profile.name),
    [avatar, setAvatar] = useState(profile.avatar),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  return (
    <Modal
      title="Your settler"
      eyebrow="PLAYER PROFILE"
      icon={UserRound}
      onClose={onClose}
    >
      <p className="dialog-intro">
        Pick a familiar face and a name for game night.
      </p>
      <form
        className="dialog-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) {
            setErr("Enter a settler name.");
            return;
          }
          setBusy(true);
          try {
            await submit({ name: name.trim(), avatar });
          } catch (e) {
            setErr(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset>
          <legend>Avatar</legend>
          <div className="avatar-picker">
            {ANIMALS.map((a) => (
              <label key={a} className={a === avatar ? "chosen" : ""}>
                <input
                  type="radio"
                  name="avatar"
                  checked={avatar === a}
                  onChange={() => setAvatar(a)}
                />
                <Avatar animal={a} size={49} />
                <span>{cap(a)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          Settler name
          <input
            required
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <ErrorLine error={err} />
        <button className="btn btn-gold" disabled={busy}>
          <Check size={17} />
          Save profile
        </button>
      </form>
    </Modal>
  );
}
export function InviteDialog({ room, onClose, onCopy }) {
  const [copied, setCopied] = useState("");
  async function handle(which, text) {
    if (
      await onCopy(
        text,
        which === "code" ? "Room code copied" : "Invite link copied",
      )
    )
      setCopied(which);
  }
  return (
    <Modal
      title="Invite your friends"
      icon={UsersRound}
      eyebrow="SAVE THEM A SEAT"
      onClose={onClose}
    >
      <p className="dialog-intro">
        Send a link to your table, or share this room code.
      </p>
      <div className="big-code">
        <span className="eyebrow">ROOM CODE</span>
        <strong>{room.code}</strong>
        <button
          className="small-button"
          onClick={() => handle("code", room.code)}
        >
          {copied === "code" ? <Check size={15} /> : <Copy size={15} />}{" "}
          {copied === "code" ? "Copied" : "Copy code"}
        </button>
      </div>
      <label className="input-label">
        Private invite link
        <input
          readOnly
          onFocus={(e) => e.target.select()}
          value={inviteUrl(room.code)}
        />
      </label>
      <button
        className="btn btn-gold wide-btn invite-copy"
        onClick={() => handle("link", inviteUrl(room.code))}
      >
        {copied === "link" ? <Check size={17} /> : <Link size={17} />}{" "}
        {copied === "link" ? "Link copied" : "Copy invite link"}
      </button>
    </Modal>
  );
}
export function LeaveDialog({ onClose, onLeave, playing, busy }) {
  return (
    <Modal
      title="Leave this room?"
      eyebrow="LEAVE THE TABLE"
      icon={LogOut}
      onClose={onClose}
    >
      <p className="dialog-intro">
        {playing
          ? "A bot will take over your seat so your friends can finish the game."
          : "Your seat will open up. You can join again with the room code while the table is open."}
      </p>
      <div className="modal-actions">
        <button className="btn btn-muted" onClick={onClose}>
          Stay here
        </button>
        <button className="btn btn-gold" disabled={busy} onClick={onLeave}>
          Leave room
          <ArrowRight size={16} />
        </button>
      </div>
    </Modal>
  );
}
const steps = [
  {
    icon: Flag,
    title: "Set the table",
    text: "Create a private room for 2–4 settlers. Share the code or invite link. Each player starts with two placed settlements and two roads.",
  },
  {
    icon: Dices,
    title: "Roll and collect",
    text: "Roll two dice on your turn. Every matching tile produces for its neighbors: one resource per settlement, two per city. On a seven, move the robber to block another tile and take one resource from a neighboring opponent, if possible.",
  },
  {
    icon: HandCoins,
    title: "Trade and build",
    text: "Exchange four matching resources for one at the bank, or offer a 1:1 trade to the table. Build along your roads and keep settlements at least two edges apart.",
  },
  {
    icon: Trophy,
    title: "Claim victory",
    text: "Settlements are worth one point, cities two. The first settler to reach the room’s victory target wins. No development cards or bonus points in this island edition.",
  },
];
export function GuideDialog({
  initial = "overview",
  resource = "lumber",
  onClose,
}) {
  const [tab, setTab] = useState(initial),
    [sel, setSel] = useState(resource);
  return (
    <Modal
      title="The field guide"
      eyebrow="KNOW YOUR ISLAND"
      icon={BookOpen}
      wide
      onClose={onClose}
    >
      <p className="dialog-intro">
        A pocket guide to your first game and every island after.
      </p>
      <div
        className="guide-tabs"
        role="tablist"
        aria-label="Field guide topics"
      >
        {[
          ["overview", "How to play"],
          ["resources", "Resources"],
          ["building", "Building"],
        ].map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "overview" ? (
        <div className="guide-steps" role="tabpanel">
          {steps.map((s, i) => (
            <div className="guide-step" key={s.title}>
              <div className="step-icon">
                <s.icon size={19} />
              </div>
              <div>
                <small>0{i + 1}</small>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : tab === "resources" ? (
        <div className="guide-resources" role="tabpanel">
          <div className="resource-picks">
            {RESOURCES.map((r) => (
              <button
                key={r}
                aria-pressed={sel === r}
                onClick={() => setSel(r)}
              >
                <ResourceArt type={r} size={43} />
                <span>{cap(r)}</span>
              </button>
            ))}
          </div>
          <div
            className="resource-detail"
            style={{ "--resource-color": RES_INFO[sel].color }}
          >
            <div className="detail-art">
              <ResourceArt type={sel} size={95} />
            </div>
            <div>
              <span className="eyebrow">
                {RES_INFO[sel].land.toUpperCase()} TILE
              </span>
              <h3>{cap(sel)}</h3>
              <p>{RES_INFO[sel].text}</p>
              <small>
                <Layers3 size={13} />
                {RES_INFO[sel].use}
              </small>
            </div>
          </div>
        </div>
      ) : (
        <div className="build-guide" role="tabpanel">
          {[
            [
              "road",
              Route,
              "Extend from one of your roads or settlements. Roads connect you to new building sites.",
            ],
            [
              "settlement",
              House,
              "Build on a free intersection connected to your road. Leave at least one empty corner between settlements.",
            ],
            [
              "city",
              Castle,
              "Upgrade one of your settlements to a city. It earns two points total and collects twice as many resources.",
            ],
          ].map(([kind, Icon, desc]) => (
            <div key={kind} className="build-guide-row">
              <div className="step-icon">
                <Icon size={20} />
              </div>
              <div>
                <h3>{cap(kind)}</h3>
                <p>{desc}</p>
                <div className="price-tags">
                  {Object.entries(PRICES[kind]).map(([r, n]) => (
                    <span key={r}>
                      <i style={{ background: RES_INFO[r].color }} />
                      {n} {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
