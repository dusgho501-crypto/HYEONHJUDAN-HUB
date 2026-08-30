"use client";

import { useEffect, useState } from "react";
import "./style.css";

const CHANNEL =
  process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL ||
  "https://www.youtube.com/channel/UCltJz_jkCxQxd2mTqrn3Lfg";

const TOONATION =
  process.env.NEXT_PUBLIC_TOONATION_URL ||
  "https://toon.at/donate/hyunjujuju030";

const COMMUNITY =
  process.env.NEXT_PUBLIC_YOUTUBE_POSTS_URL ||
  `${CHANNEL.replace(/\/$/, "")}/posts`;

export default function Hub() {
  const [data, setData] = useState({
    loading: true,
    videos: [],
    live: null,
    error: null,
  });

  const [page, setPage] = useState("home");

  useEffect(() => {
    fetch("/api/youtube")
      .then((r) => {
        if (!r.ok) {
          throw new Error("YouTube API 응답 오류");
        }
        return r.json();
      })
      .then(setData)
      .catch((e) => {
        setData({
          loading: false,
          videos: [],
          live: null,
          error: e.message,
        });
      });
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(console.error);
    }
  }, []);

  const go = (url) => {
    if (!url) return;

    window.location.assign(url);
  };

  const fmt = (d) => {
    if (!d) return "";

    return new Date(d).toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="app">
      <header className="hero">
        <button
          className="bell"
          onClick={() => setPage("settings")}
          aria-label="알림 설정"
          type="button"
        >
          🔔
        </button>

        <div className="avatar">💜</div>

        <h1>현주님 HUB</h1>

        <p>현주님의 모든 소식을 한 곳에서 💜</p>
      </header>

      <main>
        {page === "home" && (
          <>
            <section
              className={
                "card live " + (data.live ? "on" : "")
              }
            >
              <div className="liveTop">
                <span className="dot"></span>

                LIVE

                <span className="badge">
                  {data.live
                    ? "지금 방송 중!"
                    : "현재 방송 없음"}
                </span>
              </div>

              <h2>
                {data.live?.title ||
                  "현주님의 다음 방송을 기다려요"}
              </h2>

              <p>
                {data.live
                  ? "지금 바로 만나보세요 ✨"
                  : "새 라이브가 시작되면 이곳에 자동으로 표시됩니다."}
              </p>

              <button
                className="primary"
                onClick={() =>
                  go(data.live?.url || CHANNEL)
                }
                type="button"
              >
                {data.live
                  ? "🔴 라이브 보러가기 →"
                  : "▶️ YouTube 채널 보기 →"}
              </button>
            </section>

            <section className="card channel">
              <div>
                <b>▶️ 현주님 YouTube</b>
                <small>실제 채널과 연결됨</small>
              </div>

              <button
                onClick={() => go(CHANNEL)}
                type="button"
              >
                채널 열기 ↗
              </button>
            </section>

            <section className="card">
              <div className="title">
                🎥 최신 영상

                <button
                  onClick={() => setPage("videos")}
                  type="button"
                >
                  더보기 ›
                </button>
              </div>

              {data.loading ? (
                <div className="skeleton" />
              ) : data.videos.length > 0 ? (
                data.videos
                  .slice(0, 3)
                  .map((v) => (
                    <Video
                      key={v.id}
                      v={v}
                      go={go}
                      fmt={fmt}
                    />
                  ))
              ) : (
                <p className="muted">
                  아직 표시할 영상이 없습니다.
                </p>
              )}

              {data.error && (
                <p className="error">
                  YouTube API 연결 준비가 필요합니다:{" "}
                  {data.error}
                </p>
              )}
            </section>

            <section className="card post">
              <div className="title">
                📝 게시물

                <button
                  onClick={() => go(COMMUNITY)}
                  type="button"
                >
                  게시물 보기 ›
                </button>
              </div>

              <p>
                <b>현주님의 YouTube 게시물</b>
              </p>

              <p className="muted">
                현주님의 최신 게시물과 소식을
                YouTube에서 확인할 수 있습니다.
              </p>
            </section>

            <section className="card support">
              <div>
                <b>💛 투네이션 후원</b>

                <small>
                  현주님에게 응원을 보내주세요
                </small>
              </div>

              <button
                onClick={() => go(TOONATION)}
                type="button"
              >
                후원하기 ↗
              </button>
            </section>

            <section className="card news">
              <div className="title">
                🔔 최근 소식
              </div>

              {data.live && (
                <Item
                  icon="🔴"
                  title="라이브 시작"
                  text={data.live.title}
                  time="현재"
                />
              )}

              {data.videos.slice(0, 3).map((v) => (
                <Item
                  key={v.id}
                  icon="▶️"
                  title="새 영상"
                  text={v.title}
                  time={fmt(v.publishedAt)}
                />
              ))}

              {!data.live &&
                data.videos.length === 0 &&
                !data.loading && (
                  <p className="muted">
                    최근 소식이 없습니다.
                  </p>
                )}
            </section>
          </>
        )}

        {page === "videos" && (
          <>
            <Back setPage={setPage} />

            <h2>🎥 영상</h2>

            {data.loading ? (
              <section className="card">
                <div className="skeleton" />
              </section>
            ) : data.videos.length > 0 ? (
              data.videos.map((v) => (
                <section
                  className="card"
                  key={v.id}
                >
                  <Video
                    v={v}
                    go={go}
                    fmt={fmt}
                  />
                </section>
              ))
            ) : (
              <section className="card">
                <p className="muted">
                  표시할 영상이 없습니다.
                </p>
              </section>
            )}
          </>
        )}

        {page === "settings" && (
          <>
            <Back setPage={setPage} />

            <h2>🔔 알림 설정</h2>

            <section className="card">
              <Setting
                t="🔴 라이브 시작"
                storageKey="live"
              />

              <Setting
                t="🎥 새 영상"
                storageKey="video"
              />

              <Setting
                t="📝 새 게시물"
                storageKey="post"
              />

              <p className="muted">
                알림을 켜면 이 기기에서 현주님의
                새로운 소식을 받을 수 있도록 준비합니다.
              </p>
            </section>
          </>
        )}
      </main>

      <nav>
        <button
          className={
            page === "home" ? "active" : ""
          }
          onClick={() => setPage("home")}
          type="button"
        >
          ⌂
          <small>홈</small>
        </button>

        <button
          className={
            page === "videos" ? "active" : ""
          }
          onClick={() => setPage("videos")}
          type="button"
        >
          ▶
          <small>영상</small>
        </button>

        <button
          onClick={() => go(COMMUNITY)}
          type="button"
        >
          ▢
          <small>게시물</small>
        </button>

        <button
          onClick={() => go(TOONATION)}
          type="button"
        >
          ♡
          <small>후원</small>
        </button>
      </nav>
    </div>
  );
}

function Video({ v, go, fmt }) {
  return (
    <div
      className="video"
      onClick={() => go(v.url)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go(v.url);
        }
      }}
    >
      <img
        src={v.thumbnail}
        alt={v.title}
      />

      <div>
        <h3>{v.title}</h3>

        <span>
          {fmt(v.publishedAt)} · 조회수{" "}
          {v.views ?? "-"}
        </span>
      </div>
    </div>
  );
}

function Item({ icon, title, text, time }) {
  return (
    <div className="item">
      <i>{icon}</i>

      <div>
        <b>{title}</b>
        <small>{text}</small>
      </div>

      <em>{time}</em>
    </div>
  );
}

function Setting({ t, storageKey }) {
  const [on, setOn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "hyeonju-notification-" + storageKey
      );

      if (saved === "true") {
        setOn(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, [storageKey]);

  const saveState = (value) => {
    setOn(value);

    try {
      localStorage.setItem(
        "hyeonju-notification-" + storageKey,
        String(value)
      );
    } catch (e) {
      console.error(e);
    }
  };

  const toggle = async () => {
    if (loading) return;

    if (on) {
      saveState(false);
      return;
    }

    try {
      setLoading(true);

      if (!("serviceWorker" in navigator)) {
        throw new Error(
          "이 브라우저에서는 서비스 워커를 지원하지 않습니다."
        );
      }

      if (!("PushManager" in window)) {
        throw new Error(
          "이 브라우저에서는 Push 알림을 지원하지 않습니다."
        );
      }

      if (!("Notification" in window)) {
        throw new Error(
          "이 브라우저에서는 알림 기능을 지원하지 않습니다."
        );
      }

      let permission = Notification.permission;

      if (permission !== "granted") {
        permission =
          await Notification.requestPermission();
      }

      if (permission !== "granted") {
        throw new Error(
          "알림 권한이 허용되지 않았습니다."
        );
      }

      const registration =
        await navigator.serviceWorker.ready;

      const publicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error(
          "VAPID Public Key가 설정되지 않았습니다."
        );
      }

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              publicKeyToUint8Array(publicKey),
          });
      }

      const response = await fetch("/api/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      let result = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ||
            "Push 구독 저장에 실패했습니다."
        );
      }

      saveState(true);

      alert(
        "🔔 알림 설정이 완료되었습니다!"
      );
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "알림 설정 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setting">
      <b>{t}</b>

      <button
        className={
          "switch " + (on ? "on" : "")
        }
        onClick={toggle}
        disabled={loading}
        aria-label={
          on
            ? `${t} 알림 끄기`
            : `${t} 알림 켜기`
        }
        aria-pressed={on}
        type="button"
      >
        <span />
      </button>
    </div>
  );
}

function publicKeyToUint8Array(base64String) {
  const padding =
    "=".repeat(
      (4 - (base64String.length % 4)) % 4
    );

  const base64 =
    (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) =>
      char.charCodeAt(0)
    )
  );
}

function Back({ setPage }) {
  return (
    <button
      className="back"
      onClick={() => setPage("home")}
      type="button"
    >
      ← 홈으로
    </button>
  );
}
