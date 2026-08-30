"use client";

import { useEffect, useState } from "react";
import "./style.css";

const CHANNEL = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL;
const TOONATION = process.env.NEXT_PUBLIC_TOONATION_URL;

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
      .then((r) => r.json())
      .then(setData)
      .catch((e) =>
        setData({
          loading: false,
          error: e.message,
          videos: [],
          live: null,
        })
      );
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
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString("ko-KR", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <div className="app">
      <header className="hero">
        <button
          className="bell"
          onClick={() => setPage("settings")}
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
                    ? "지금 방송 중"
                    : "현재 방송 없음"}
                </span>
              </div>

              <h2>
                {data.live?.title ||
                  "현주님의 다음 방송을 기다려요"}
              </h2>

              <p>
                {data.live
                  ? "지금 바로 만나보세요 💜"
                  : "라이브가 시작되면 자동으로 표시됩니다."}
              </p>

              <button
                className="primary"
                onClick={() =>
                  go(data.live?.url || CHANNEL)
                }
              >
                {data.live
                  ? "📺 라이브 보러가기"
                  : "🎬 YouTube 채널 보기"}
              </button>
            </section>

            <section className="card channel">
              <div>
                <b>🎬 현주님 YouTube</b>
                <small>실제 채널과 연결됨</small>
              </div>

              <button onClick={() => go(CHANNEL)}>
                채널 보기 →
              </button>
            </section>

            <section className="card">
              <div className="title">
                🆕 최신 영상

                <button onClick={() => setPage("videos")}>
                  더보기 →
                </button>
              </div>

              {data.loading ? (
                <div className="skeleton" />
              ) : (
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
              )}

              {data.error && (
                <p className="error">
                  YouTube API 연결 오류: {data.error}
                </p>
              )}
            </section>

            <section className="card post">
              <div className="title">
                💬 게시판

                <button
                  onClick={() =>
                    go(CHANNEL + "/community")
                  }
                >
                  YouTube에서 보기 →
                </button>
              </div>

              <p>
                현주님의 최신 소식과 커뮤니티를 확인해보세요.
              </p>
            </section>

            {TOONATION && (
              <section className="card support">
                <div className="title">
                  💜 응원하기
                </div>

                <button
                  className="primary"
                  onClick={() => go(TOONATION)}
                >
                  투네이션으로 응원하기
                </button>
              </section>
            )}
          </>
        )}

        {page === "videos" && (
          <>
            <Back setPage={setPage} />

            <h2>🎥 최신 영상</h2>

            <section className="card">
              {data.loading ? (
                <div className="skeleton" />
              ) : data.videos.length > 0 ? (
                data.videos.map((v) => (
                  <Video
                    key={v.id}
                    v={v}
                    go={go}
                    fmt={fmt}
                  />
                ))
              ) : (
                <p>표시할 영상이 없습니다.</p>
              )}
            </section>
          </>
        )}

        {page === "settings" && (
          <>
            <Back setPage={setPage} />

            <h2>🔔 알림 설정</h2>

            <section className="card">
              <Setting t="🔴 라이브 시작" />
              <Setting t="🎥 새 영상" />
            </section>

            <section className="card">
              <p>
                알림을 켜두면 새로운 라이브와 영상이
                등록되었을 때 휴대폰으로 알려드립니다.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Video({ v, go, fmt }) {
  return (
    <article className="video">
      {v.thumbnail && (
        <img
          src={v.thumbnail}
          alt={v.title || "YouTube 영상"}
        />
      )}

      <div className="videoInfo">
        <b>{v.title}</b>

        {v.publishedAt && (
          <small>{fmt(v.publishedAt)}</small>
        )}

        <button onClick={() => go(v.url)}>
          영상 보기 →
        </button>
      </div>
    </article>
  );
}

function Back({ setPage }) {
  return (
    <button
      className="back"
      onClick={() => setPage("home")}
    >
      ← 돌아가기
    </button>
  );
}

function Setting({ t }) {
  const [on, setOn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSubscription = async () => {
      try {
        if (!("serviceWorker" in navigator)) {
          return;
        }

        if (!("PushManager" in window)) {
          return;
        }

        if (Notification.permission !== "granted") {
          if (mounted) {
            setOn(false);
          }

          return;
        }

        const registration =
          await navigator.serviceWorker.ready;

        const subscription =
          await registration.pushManager.getSubscription();

        if (mounted) {
          setOn(!!subscription);
        }
      } catch (error) {
        console.error(
          "Push subscription 확인 실패:",
          error
        );

        if (mounted) {
          setOn(false);
        }
      }
    };

    checkSubscription();

    return () => {
      mounted = false;
    };
  }, []);

  const toggle = async () => {
    if (loading) return;

    if (on) {
      try {
        setLoading(true);

        const registration =
          await navigator.serviceWorker.ready;

        const subscription =
          await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();
        }

        setOn(false);

        alert("🔕 알림이 꺼졌습니다.");
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "알림을 끄는 중 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }

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

      let permission = Notification.permission;

      if (permission !== "granted") {
        permission =
          await Notification.requestPermission();
      }

      if (permission !== "granted") {
        throw new Error(
          "알림 권한을 허용하지 않았습니다."
        );
      }

      const registration =
        await navigator.serviceWorker.ready;

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        const publicKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!publicKey) {
          throw new Error(
            "VAPID Public Key가 설정되지 않았습니다."
          );
        }

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

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ||
            "Push 구독 저장에 실패했습니다."
        );
      }

      setOn(true);

      alert("🔔 알림 설정이 완료되었습니다!");
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
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
        className={"switch " + (on ? "on" : "")}
        onClick={toggle}
        disabled={loading}
      >
        <span />
      </button>
    </div>
  );
}

function publicKeyToUint8Array(base64String) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) =>
      char.charCodeAt(0)
    )
  );
}