import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleAlert,
  Compass,
  Hexagon,
  LayoutGrid,
  LoaderCircle,
  Ticket,
  X,
} from "lucide-react";
import { Avatar, BrandMark } from "./components/Art.jsx";
import Lobby from "./components/Lobby.jsx";
import Room from "./components/Room.jsx";
import Game from "./components/Game.jsx";
import {
  CreateDialog,
  GuideDialog,
  InviteDialog,
  JoinDialog,
  JoinForm,
  LeaveDialog,
  ProfileDialog,
} from "./components/Dialogs.jsx";
import { api, codeFromPath, copy, readRoom, readStore, store, roomPath, publicLobby } from "./lib.js";

export default function App() {
  const [code, setCode] = useState(codeFromPath),
    [room, setRoom] = useState(null),
    [pageError, setPageError] = useState(""),
    [offline, setOffline] = useState(false),
    [retry, setRetry] = useState(0);
  const [profile, setProfile] = useState(() =>
      readStore("profile", { name: "Guest", avatar: "fox" }),
    ),
    [modal, setModal] = useState(null),
    [notice, setNotice] = useState(null),
    [busy, setBusy] = useState(false),
    [resumeRoom, setResumeRoom] = useState(null);
  const pending = useRef(false),
    currentCode = useRef(code),
    noticeTimer = useRef(null);
  currentCode.current = code;
  const toast = useCallback((text, err = false) => {
    clearTimeout(noticeTimer.current);
    setNotice({ text, err });
    noticeTimer.current = setTimeout(() => setNotice(null), 4200);
  }, []);
  const update = useCallback((r) => {
    setRoom((old) =>
      old?.code === r.code &&
      old.isMember &&
      r.isMember &&
      old.revision > r.revision
        ? old
        : r,
    );
  }, []);
  useEffect(() => {
    const onPop = () => {
      const c = codeFromPath();
      currentCode.current = c;
      setCode(c);
      setRoom(null);
      setPageError("");
      setModal(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    let active = true;
    async function health() {
      try {
        await api("/status");
        if (active) setOffline(false);
      } catch {
        if (active) setOffline(true);
      }
    }
    health();
    const timer = setInterval(health, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    let live = true,
      timer;
    setPageError("");
    if (!code) {
      const last = readStore("last-room", "", true);
      if (last)
        readRoom(last)
          .then((r) => {
            if (live) setResumeRoom(r.isMember ? r : null);
          })
          .catch(() => {
            if (live) setResumeRoom(null);
          });
      else setResumeRoom(null);
      return () => {
        live = false;
      };
    }
    async function poll() {
      let again = true;
      try {
        const r = await readRoom(code);
        if (!live) return;
        update(r);
        setPageError("");
        setOffline(false);
        if (r.isMember) {
          store("last-room", r.code, true);
          setResumeRoom(r);
        }
      } catch (e) {
        if (!live) return;
        if (e.status === 404) {
          setRoom(null);
          setPageError(e.message);
          again = false;
        } else {
          setOffline(true);
          setPageError(e.message);
        }
      }
      if (live && again)
        timer = setTimeout(poll, document.hidden ? 4500 : 1250);
    }
    poll();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [code, retry, update]);
  useEffect(() => {
    document.title = code
      ? room?.name
        ? `${room.name} — Colonist`
        : "Private room — Colonist"
      : "Colonist — Game Lobby";
  }, [code, room?.name]);
  const navigate = (c, r = null) => {
    const path = roomPath(c);
    if (location.pathname + location.search !== path) {
      try {
        history.pushState(history.state, "", path);
      } catch {
        // The room still works in memory if the frame disallows navigation history.
      }
    }
    currentCode.current = c;
    setCode(c);
    setRoom(r);
    setPageError("");
    setModal(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const goHome = () => {
    if (code && room?.isMember) setResumeRoom(room);
    navigate("");
  };
  function saveProfile(p) {
    setProfile(p);
    store("profile", p);
  }
  function enter(r) {
    store("last-room", r.code, true);
    setResumeRoom(r);
    navigate(r.code, r);
  }
  const create = async (data) => {
    const r = await api("/rooms", data);
    saveProfile({ name: data.name, avatar: data.avatar });
    enter(r);
  };
  const join = async (c, data) => {
    const r = await api("/rooms/" + c + "/join", data);
    saveProfile(data);
    enter(r);
    toast("Your seat is saved. Welcome to the table!");
  };
  async function action(name, body = {}) {
    if (pending.current || !code) return null;
    pending.current = true;
    setBusy(true);
    try {
      const r = await api(`/rooms/${code}/${name}`, body);
      if (currentCode.current === code) {
        if (r.left) {
          store("last-room", "", true);
          setResumeRoom(null);
          navigate("");
          toast("You left the room.");
        } else update(r);
      }
      return r;
    } catch (e) {
      toast(e.message, true);
      return null;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function onCopy(value, message) {
    const ok = await copy(value).catch(() => false);
    toast(
      ok ? message : "Select the code or invite link and copy it manually.",
      !ok,
    );
    return ok;
  }
  const guide = (tab = "overview", resource = "lumber") =>
    setModal({ kind: "guide", tab, resource });
  const close = () => setModal(null);
  const activeRoom = room?.code === code ? room : null;
  const common = {
    room: activeRoom,
    action,
    busy,
    onLobby: goHome,
    onCopy,
    onLeave: () => setModal({ kind: "leave" }),
    onInvite: () => setModal({ kind: "invite" }),
    onGuide: guide,
  };
  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="container nav-inner">
          <button className="brand" aria-label="Colonist home" onClick={goHome}>
            <BrandMark />
            <span>Colonist</span>
          </button>
          <div className="nav-divider" />
          <nav className="main-nav" aria-label="Main navigation">
            <button
              className={
                "nav-link " + (modal?.kind !== "guide" ? "active" : "")
              }
              onClick={goHome}
              aria-current={!code ? "page" : undefined}
            >
              <LayoutGrid size={16} />
              <span>Lobby</span>
            </button>
            <button
              className={
                "nav-link " + (modal?.kind === "guide" ? "active" : "")
              }
              onClick={() => guide()}
            >
              <BookOpen size={16} />
              <span>How to play</span>
            </button>
          </nav>
          <div className="nav-end">
            <div
              className={"network " + (offline ? "offline" : "")}
              title={
                offline
                  ? "Reconnecting to the game server"
                  : "Connected to the game server"
              }
            >
              <span className="status-dot" />
              {offline ? "Reconnecting" : "Online"}
            </div>
            <span className="profile-divider" />
            <button
              className="profile-button"
              aria-label="Edit your settler profile"
              onClick={() => setModal({ kind: "profile" })}
            >
              <Avatar animal={profile.avatar} size={33} />
              <strong>{profile.name}</strong>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </header>
      {!code ? (
        <Lobby
          currentRoom={resumeRoom}
          resume={() => enter(resumeRoom)}
          onCreate={() => setModal({ kind: "create" })}
          onJoin={(r) =>
            r.isMember ? enter(r) : setModal({ kind: "join", room: r })
          }
          onGuide={guide}
        />
      ) : !activeRoom ? (
        <main className="container route-page">
          <div className="route-card">
            <div className="modal-icon">
              {pageError ? (
                <Compass size={25} />
              ) : (
                <LoaderCircle className="spin" size={24} />
              )}
            </div>
            <h1>{pageError ? "Island not found" : "Finding your table…"}</h1>
            <p>{pageError || "Checking your private room invitation."}</p>
            {pageError && (
              <div className="modal-actions">
                <button
                  className="btn btn-muted"
                  onClick={() => setRetry((x) => x + 1)}
                >
                  Try again
                </button>
                <button className="btn btn-gold" onClick={goHome}>
                  Back to lobby
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </main>
      ) : !activeRoom.isMember ? (
        <main className="container route-page">
          <div className="invitation-card">
            <div className="invite-art" />
            <div className="invitation-body">
              <div className="eyebrow">
                <Ticket size={14} />A PRIVATE INVITATION
              </div>
              <h1>You’re invited.</h1>
              <p className="dialog-intro">
                Your next island adventure is a seat away.
              </p>
              <JoinForm
                profile={profile}
                room={activeRoom}
                submit={join}
                onCancel={goHome}
              />
            </div>
          </div>
        </main>
      ) : activeRoom.status === "waiting" ? (
        <Room {...common} />
      ) : (
        <Game {...common} />
      )}
      <footer className="site-footer container">
        <div>
          <Hexagon size={15} />
          <span>Colonist</span>
          <i />
          Multiplayer board game
        </div>
        <span className="footer-motto">
          <a href={publicLobby} target="_blank" rel="noreferrer" style={{color:"inherit"}}>Open public game lobby ↗</a>
        </span>
      </footer>
      {modal?.kind === "create" && (
        <CreateDialog profile={profile} submit={create} onClose={close} />
      )}
      {modal?.kind === "join" && (
        <JoinDialog
          room={modal.room}
          profile={profile}
          submit={join}
          onClose={close}
        />
      )}
      {modal?.kind === "guide" && (
        <GuideDialog
          initial={modal.tab}
          resource={modal.resource}
          onClose={close}
        />
      )}
      {modal?.kind === "profile" && (
        <ProfileDialog
          profile={profile}
          onClose={close}
          submit={async (p) => {
            if (code && activeRoom?.isMember) {
              const r = await api(`/rooms/${code}/profile`, p);
              update(r);
            }
            saveProfile(p);
            close();
            toast("Settler profile saved");
          }}
        />
      )}
      {modal?.kind === "invite" && activeRoom && (
        <InviteDialog room={activeRoom} onCopy={onCopy} onClose={close} />
      )}
      {modal?.kind === "leave" && activeRoom && (
        <LeaveDialog
          playing={activeRoom.status === "playing"}
          busy={busy}
          onLeave={() => action("leave")}
          onClose={close}
        />
      )}
      {notice && (
        <div
          className={"toast " + (notice.err ? "error" : "")}
          role={notice.err ? "alert" : "status"}
        >
          {notice.err ? <CircleAlert size={17} /> : <Check size={17} />}
          <span>{notice.text}</span>
          <button aria-label="Dismiss message" onClick={() => setNotice(null)}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
