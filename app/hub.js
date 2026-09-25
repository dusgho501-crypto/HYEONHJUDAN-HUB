"use client";

import { useEffect, useState } from "react";
import { I18nProvider, LANGUAGE_OPTIONS, useI18n } from "./i18n";
import "./style.css";

const CHANNEL = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || "https://www.youtube.com/channel/UCltJz_jkCxQxd2mTqrn3Lfg";
const TOONATION = process.env.NEXT_PUBLIC_TOONATION_URL || "https://toon.at/donate/hyunjujuju030";
const COMMUNITY = process.env.NEXT_PUBLIC_YOUTUBE_POSTS_URL || `${CHANNEL.replace(/\/$/, "")}/posts`;
const OPEN_CHAT = "https://open.kakao.com/o/sHsEr66h";
const INSTAGRAM = "https://www.instagram.com/030901_j/";
const THREADS = "https://www.threads.com/@030901_j";

function HubContent() {
  const [data, setData] = useState({ loading:true, videos:[], live:null, recentLives:[], error:null });
  const [page, setPage] = useState("home");
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const { language, setLanguage, t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/youtube")
      .then(r => { if (!r.ok) throw new Error("YouTube API 응답 오류"); return r.json(); })
      .then(j => setData({
        loading:false,
        videos:j.videos || [],
        live:j.live || null,
        recentLives:j.recentLives || [],
        error:j.error || null
      }))
      .catch(e => setData({ loading:false,videos:[],live:null,recentLives:[],error:e.message }));
  }, []);
  useEffect(() => {
    fetch("/api/community")
      .then((r) => {
        if (!r.ok) throw new Error("Community API 응답 오류");
        return r.json();
      })
      .then((json) => {
        if (!json.ok) {
          throw new Error(json.error || "게시물을 불러오지 못했습니다.");
        }
        setCommunityPosts(json.posts || []);
      })
      .catch((e) => {
        console.error("Community posts:", e);
      })
      .finally(() => {
        setCommunityLoading(false);
      });
  }, []);



  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(console.error);
  }, []);

  const go = url => { if (url) window.location.assign(url); };
  const openPage = p => { setPage(p); setMenuOpen(false); window.scrollTo({top:0,behavior:"smooth"}); };
  const fmt = d => d ? new Date(d).toLocaleString(({ko:"ko-KR",en:"en-US",ja:"ja-JP",zh:"zh-CN",fr:"fr-FR",de:"de-DE"}[language] || "ko-KR"),{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "";

  return (
    <div className="site">
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={() => openPage("home")} type="button">
            <span className="brand-mark">💜</span>
            <span><strong>현주의스토리.zip</strong><small>HYEONJU UNIVERSE</small></span>
          </button>

          <nav className="top-nav">
            <button className={page==="home"?"active":""} onClick={() => openPage("home")} type="button">{t("nav.home")}</button>
            <button className={page==="videos"?"active":""} onClick={() => openPage("videos")} type="button">{t("nav.videos")}</button>
            <button onClick={() => go(COMMUNITY)} type="button">{t("nav.post")}</button>
            <button onClick={() => go(TOONATION)} type="button">{t("nav.support")}</button>
            
            <div className="language-picker">
              <span aria-hidden="true">🌐</span>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                aria-label={t("nav.notification")}
              >
                {LANGUAGE_OPTIONS.map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>

<button className="header-bell" onClick={() => openPage("settings")} type="button">🔔</button>
            <button
              className={"menu-toggle " + (menuOpen ? "active" : "")}
              onClick={() => setMenuOpen(v => !v)}
              type="button"
              aria-label="전체 메뉴"
              aria-expanded={menuOpen}
            >
              <span>☰</span>
              <small>{t("menu.all")}</small>
            </button>
          </nav>

          {menuOpen && (
            <>
              <button
                className="menu-backdrop"
                onClick={() => setMenuOpen(false)}
                aria-label="메뉴 닫기"
                type="button"
              />
              <aside className="menu-panel">
                <div className="menu-panel-head">
                  <div>
                    <span className="section-label">MENU</span>
                    <h2>현주의스토리.zip</h2>
                  </div>
                  <button
                    className="menu-close"
                    onClick={() => setMenuOpen(false)}
                    type="button"
                    aria-label="메뉴 닫기"
                  >
                    ×
                  </button>
                </div>

                <div className="menu-list">
                  <button onClick={() => openPage("home")} type="button">
                    🏠 <span>{t("menu.home")}</span>
                  </button>
                  <button onClick={() => openPage("videos")} type="button">
                    🎥 <span>{t("menu.videos")}</span>
                  </button>
                  <button onClick={() => { go(COMMUNITY); setMenuOpen(false); }} type="button">
                    📝 <span>{t("menu.news")}</span>
                  </button>
                  <button onClick={() => openPage("settings")} type="button">
                    🔔 <span>{t("menu.notification")}</span>
                  </button>
                </div>

                <div className="menu-divider" />

                <div className="menu-list">
                  <button onClick={() => { go(CHANNEL); setMenuOpen(false); }} type="button">
                    ▶️ <span>YouTube</span>
                  </button>
                  <button onClick={() => { go(TOONATION); setMenuOpen(false); }} type="button">
                    💛 <span>Toonation</span>
                  </button>
                  <button onClick={() => { go(OPEN_CHAT); setMenuOpen(false); }} type="button">
                    💬 <span>오픈채팅</span>
                  </button>
                  <button onClick={() => { go(INSTAGRAM); setMenuOpen(false); }} type="button">
                    📷 <span>Instagram</span>
                  </button>
                  <button onClick={() => { go(THREADS); setMenuOpen(false); }} type="button">
                    🧵 <span>Threads</span>
                  </button>
                </div>
              </aside>
            </>
          )}
          
        </div>
      </header>

      {page === "home" && (
        <main className="container">
          <section className="hero-section">
            <div className="hero-copy">
              <span className="eyebrow">HYEONJU'S LITTLE UNIVERSE</span>
              <h1>{t("brand.title")}</h1>
              <p>{t("brand.tagline")}</p>
              <div className="hero-actions">
                <button className="hero-primary" onClick={() => go(data.live?.url || CHANNEL)} type="button">
                  {data.live ? t("action.watchLive") : t("action.youtubeChannel")}
                </button>
                <button className="hero-secondary" onClick={() => openPage("settings")} type="button">🔔 방송 알림</button>
              </div>
            </div>

            <div className="hero-orbit" aria-hidden="true">
              <div className="orbit orbit-1"/><div className="orbit orbit-2"/><div className="orbit orbit-3"/>
              <div className="planet">💜</div>
              <span className="star star-1">✦</span><span className="star star-2">✧</span>
              <span className="star star-3">·</span><span className="star star-4">✦</span>
            </div>
          </section>

          <section className={"live-panel "+(data.live?"is-live":"")}>
            <div className="section-heading compact">
              <div><span className="section-label">LIVE NOW</span>
                <h2>{data.live ? "지금 현주님이 방송 중이에요" : t("live.noLive")}</h2>
              </div>
              <span className={"live-pill "+(data.live?"on":"")}><i/> {data.live?"LIVE":"OFF"}</span>
            </div>

            {data.live ? (
              <div className="live-content">
                <button className="live-image" onClick={() => go(data.live.url)} type="button">
                  <img src={data.live.thumbnail} alt={data.live.title}/><span>▶</span>
                </button>
                <div className="live-info">
                  <span className="mini-label">🔴 LIVE STREAM</span>
                  <h3>{data.live.title}</h3>
                  <p>지금 바로 현주님과 함께해요.</p>
                  <button className="text-button" onClick={() => go(data.live.url)} type="button">방송 보러가기 →</button>
                </div>
              </div>
            ) : (
              <div className="offline-live">
                <div className="offline-icon">🌙</div>
                <div><strong>{t("live.waiting")}</strong><p>{t("live.willAppear")}</p></div>
                <button onClick={() => go(CHANNEL)} type="button">채널 보기 →</button>
              </div>
            )}
          </section>

          <SectionTitle label="VIDEO" title={t("section.recentVideos")} action={t("action.viewAllVideos")} onClick={() => openPage("videos")}/>

          <section className="video-grid">
            {data.loading
              ? Array.from({length:6}).map((_,i)=><div className="video-card skeleton-card" key={i}><div className="skeleton-image"/><div className="skeleton-line"/><div className="skeleton-line short"/></div>)
              : data.videos.slice(0,6).map(v=><VideoCard key={v.id} v={v} go={go} fmt={fmt}/>)}
          </section>

          {!data.loading && !data.videos.length && <div className="empty-card">{t("empty.videos")}</div>}
          <SectionTitle
            label="POST"
            title={t("section.news")}
            action={t("action.viewAllPosts")}
            onClick={() => go(COMMUNITY)}
          />

          <section className="post-strip">
            {communityLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div className="post-card" key={i}>
                  <div className="post-card-top">
                    <span className="post-avatar">💜</span>
                    <span>
                      <strong>현주</strong>
                      <small>Community</small>
                    </span>
                  </div>

                  <div className="post-card-body">
                    <span className="post-tag">LOADING</span>
                    <h3>현주님의 최신 소식을 불러오는 중이에요.</h3>
                  </div>
                </div>
              ))
            ) : communityPosts.length > 0 ? (
              communityPosts.map((post) => (
                <button
                  className="post-card"
                  key={post.id}
                  onClick={() => go(post.url)}
                  type="button"
                >
                  {post.images?.[0] && (
                    <div className="post-thumb">
                      <img src={post.images[0]} alt="" />
                    </div>
                  )}

                  <div className="post-card-top">
                    <span className="post-avatar">💜</span>
                    <span>
                      <strong>현주</strong>
                      <small>
                        Community ·{" "}
                        {post.publishedLabel || fmt(post.publishedAt)}
                      </small>
                    </span>
                  </div>

                  <div className="post-card-body">
                    <span className="post-tag">YOUTUBE POST</span>
                    <h3>{post.text}</h3>
                    <small>
                      ❤️ {post.likes ?? 0} · 게시물 보기 →
                    </small>
                  </div>
                </button>
              ))
            ) : (
              <div className="empty-card">
                최근 게시물을 불러오지 못했어요.
              </div>
            )}
          </section>

<SectionTitle label="LIVE HISTORY" title={t("section.recentLives")}/>
          <section className="history-card">
            {data.recentLives.length
              ? data.recentLives.map(v =>
                <button className="history-item" key={v.id} onClick={() => go(v.url)} type="button">
                  <img src={v.thumbnail} alt=""/>
                  <span className="history-copy"><strong>{v.title}</strong><small>{fmt(v.startedAt)} · 방송 기록</small></span>
                  <b>→</b>
                </button>)
              : <div className="empty-history">{t("history.empty")}</div>}
          </section>

          <SectionTitle label="LINKS" title={t("section.links")}/>
          <section className="links-grid">
            <LinkCard icon="▶" title="YouTube" text={t("links.youtube")} onClick={() => go(CHANNEL)}/>
            <LinkCard icon="💛" title="Toonation" text={t("links.toonation")} onClick={() => go(TOONATION)}/>
            <LinkCard icon="💬" title="오픈채팅" text={t("links.openChat")} onClick={() => go(OPEN_CHAT)}/>
            <LinkCard icon="📷" title="Instagram" text={t("links.instagram")} onClick={() => go(INSTAGRAM)}/>
            <LinkCard icon="🧵" title="Threads" text={t("links.threads")} onClick={() => go(THREADS)}/>
          </section>

          <section className="notice-banner">
            <div className="notice-symbol">🔔</div>
            <div><span className="section-label">LIVE NOTIFICATION</span><h2>{t("notice.title")}</h2><p>{t("notice.description")}</p></div>
            <button onClick={() => openPage("settings")} type="button">{t("action.notifications")}</button>
          </section>

          {data.error && <p className="error">{data.error}</p>}
        </main>
      )}

      {page === "videos" && (
        <main className="container sub-page">
          <PageHeader emoji="🎥" title={t("videos.title")} text={t("videos.description")} back={() => openPage("home")}/>
          <section className="video-grid large">{data.videos.map(v=><VideoCard key={v.id} v={v} go={go} fmt={fmt}/>)}</section>
        </main>
      )}

      {page === "settings" && (
        <main className="container sub-page">
          <PageHeader emoji="🔔" title="방송 알림" text="현주님의 새로운 소식을 놓치지 않도록 준비해요." back={() => openPage("home")}/>
          <section className="settings-card">
            <Setting t="🔴 라이브 시작" storageKey="live"/>
            <Setting t="🎥 새 영상" storageKey="video"/>
            <Setting t="📝 새 게시물" storageKey="post"/>
            <p className="settings-help">알림을 켜면 이 기기에서 현주님의 새로운 소식을 받을 수 있도록 Push 알림을 등록합니다.</p>
          </section>
        </main>
      )}

      <footer className="footer">
        <div><strong>현주의스토리.zip</strong><span>HYEONJU'S LITTLE UNIVERSE</span></div>
        <button onClick={() => openPage("home")} type="button">맨 위로 ↑</button>
      </footer>
    </div>
  );
}

function SectionTitle({label,title,action,onClick}) {
  return <div className="section-heading"><div><span className="section-label">{label}</span><h2>{title}</h2></div>{action&&<button className="section-action" onClick={onClick} type="button">{action}</button>}</div>;
}

function VideoCard({v,go,fmt}) {
  return <button className="video-card" onClick={() => go(v.url)} type="button">
    <div className="video-image"><img src={v.thumbnail} alt={v.title}/><span>▶</span></div>
    <div className="video-meta"><strong>{v.title}</strong><small>{fmt(v.publishedAt)} · 조회수 {v.views ?? "-"}</small></div>
  </button>;
}

function LinkCard({icon,title,text,onClick}) {
  return <button className="link-card" onClick={onClick} type="button"><span className="link-icon">{icon}</span><span className="link-copy"><strong>{title}</strong><small>{text}</small></span><b>↗</b></button>;
}

function PageHeader({emoji,title,text,back}) {
  return <div className="page-header"><button className="back-button" onClick={back} type="button">←</button><span className="page-emoji">{emoji}</span><div><span className="section-label">HYEONJU UNIVERSE</span><h1>{title}</h1><p>{text}</p></div></div>;
}

function Setting({t,storageKey}) {
  const [on,setOn]=useState(false),[loading,setLoading]=useState(false);

  useEffect(() => {
    try { setOn(localStorage.getItem("hyeonju-notification-"+storageKey)==="true"); } catch(e) { console.error(e); }
  },[storageKey]);

  const save = value => {
    setOn(value);
    try { localStorage.setItem("hyeonju-notification-"+storageKey,String(value)); } catch(e) { console.error(e); }
  };

  const toggle = async () => {
    if(loading) return;
    if(on){ save(false); return; }

    try {
      setLoading(true);
      if(!("serviceWorker" in navigator)) throw new Error("이 브라우저에서는 서비스 워커를 지원하지 않습니다.");
      if(!("PushManager" in window)) throw new Error("이 브라우저에서는 Push 알림을 지원하지 않습니다.");
      if(!("Notification" in window)) throw new Error("이 브라우저에서는 알림 기능을 지원하지 않습니다.");

      let permission=Notification.permission;
      if(permission!=="granted") permission=await Notification.requestPermission();
      if(permission!=="granted") throw new Error("알림 권한이 허용되지 않았습니다.");

      const registration=await navigator.serviceWorker.ready;
      const publicKey=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if(!publicKey) throw new Error("VAPID Public Key가 설정되지 않았습니다.");

      let subscription=await registration.pushManager.getSubscription();
      if(!subscription) subscription=await registration.pushManager.subscribe({
        userVisibleOnly:true,
        applicationServerKey:publicKeyToUint8Array(publicKey)
      });

      const response=await fetch("/api/push",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(subscription)
      });

      let result={};
      try { result=await response.json(); } catch {}
      if(!response.ok || !result.ok) throw new Error(result.error || "Push 구독 저장에 실패했습니다.");

      save(true);
      alert("🔔 알림 설정이 완료되었습니다!");
    } catch(error) {
      console.error(error);
      alert(error?.message || "알림 설정 중 오류가 발생했습니다.");
    } finally { setLoading(false); }
  };

  return <div className="setting-row"><div><strong>{t}</strong><small>{loading?"설정 중...":on?"알림 켜짐":"알림 꺼짐"}</small></div>
    <button className={"switch "+(on?"on":"")} onClick={toggle} disabled={loading} aria-pressed={on} type="button"><span/></button>
  </div>;
}

function publicKeyToUint8Array(base64String) {
  const padding="=".repeat((4-(base64String.length%4))%4);
  const base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
  const rawData=window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export default function Hub() {
  return (
    <I18nProvider>
      <HubContent />
    </I18nProvider>
  );
}
