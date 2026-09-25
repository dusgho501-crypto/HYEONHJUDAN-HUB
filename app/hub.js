"use client";

import { useEffect, useState } from "react";
import "./style.css";

const CHANNEL = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || "https://www.youtube.com/channel/UCltJz_jkCxQxd2mTqrn3Lfg";
const TOONATION = process.env.NEXT_PUBLIC_TOONATION_URL || "https://toon.at/donate/hyunjujuju030";
const COMMUNITY = process.env.NEXT_PUBLIC_YOUTUBE_POSTS_URL || `${CHANNEL.replace(/\/$/, "")}/posts`;
const OPEN_CHAT = "https://open.kakao.com/o/sHsEr66h";
const INSTAGRAM = "https://www.instagram.com/030901_j/";
const THREADS = "https://www.threads.com/@030901_j";

export default function Hub() {
  const [data, setData] = useState({ loading:true, videos:[], live:null, recentLives:[], error:null });
  const [page, setPage] = useState("home");

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
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(console.error);
  }, []);

  const go = url => { if (url) window.location.assign(url); };
  const openPage = p => { setPage(p); window.scrollTo({top:0,behavior:"smooth"}); };
  const fmt = d => d ? new Date(d).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "";

  return (
    <div className="site">
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={() => openPage("home")} type="button">
            <span className="brand-mark">💜</span>
            <span><strong>현주님의 작은 우주</strong><small>HYEONJU UNIVERSE</small></span>
          </button>

          <nav className="top-nav">
            <button className={page==="home"?"active":""} onClick={() => openPage("home")} type="button">홈</button>
            <button className={page==="videos"?"active":""} onClick={() => openPage("videos")} type="button">영상</button>
            <button onClick={() => go(COMMUNITY)} type="button">Post</button>
            <button onClick={() => go(TOONATION)} type="button">후원</button>
            <button className="header-bell" onClick={() => openPage("settings")} type="button">🔔</button>
          </nav>
        </div>
      </header>

      {page === "home" && (
        <main className="container">
          <section className="hero-section">
            <div className="hero-copy">
              <span className="eyebrow">HYEONJU'S LITTLE UNIVERSE</span>
              <h1>현주님의<br/><em>작은 우주</em></h1>
              <p>현주님의 방송과 소식을 한곳에서 만나보세요.</p>
              <div className="hero-actions">
                <button className="hero-primary" onClick={() => go(data.live?.url || CHANNEL)} type="button">
                  {data.live ? "🔴 지금 방송 보기" : "▶ YouTube 채널 보기"}
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
                <h2>{data.live ? "지금 현주님이 방송 중이에요" : "지금은 방송이 없어요"}</h2>
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
                <div><strong>다음 방송을 기다리는 중이에요.</strong><p>방송이 시작되면 이곳에 바로 표시됩니다.</p></div>
                <button onClick={() => go(CHANNEL)} type="button">채널 보기 →</button>
              </div>
            )}
          </section>

          <SectionTitle label="VIDEO" title="최근 영상" action="전체 영상 보기 →" onClick={() => openPage("videos")}/>

          <section className="video-grid">
            {data.loading
              ? Array.from({length:6}).map((_,i)=><div className="video-card skeleton-card" key={i}><div className="skeleton-image"/><div className="skeleton-line"/><div className="skeleton-line short"/></div>)
              : data.videos.slice(0,6).map(v=><VideoCard key={v.id} v={v} go={go} fmt={fmt}/>)}
          </section>

          {!data.loading && !data.videos.length && <div className="empty-card">표시할 영상이 없습니다.</div>}

                    <SectionTitle
            label="POST"
            title="현주님의 소식"
            action="YouTube에서 전체 보기 →"
            onClick={() => go(COMMUNITY)}
          />

          <section className="post-strip single-post">
            <button
              className="post-card featured"
              onClick={() => go(COMMUNITY)}
              type="button"
            >
              <div className="post-card-top">
                <span className="post-avatar">💜</span>
                <span>
                  <strong>현주님 YouTube</strong>
                  <small>Community</small>
                </span>
              </div>

              <div className="post-card-body">
                <span className="post-tag">LATEST POST</span>
                <h3>
                  현주님의 최신 소식은 YouTube 게시물에서 확인해보세요.
                </h3>
                <p>
                  방송 이야기와 새로운 소식을 만나볼 수 있어요.
                </p>
              </div>

              <span className="post-arrow">→</span>
            </button>

            
          </section>
<SectionTitle label="LIVE HISTORY" title="최근 방송"/>
          <section className="history-card">
            {data.recentLives.length
              ? data.recentLives.map(v =>
                <button className="history-item" key={v.id} onClick={() => go(v.url)} type="button">
                  <img src={v.thumbnail} alt=""/>
                  <span className="history-copy"><strong>{v.title}</strong><small>{fmt(v.startedAt)} · 방송 기록</small></span>
                  <b>→</b>
                </button>)
              : <div className="empty-history">최근 방송 기록을 불러오는 중이거나 없습니다.</div>}
          </section>

          <SectionTitle label="LINKS" title="현주님 링크"/>
          <section className="links-grid">
            <LinkCard icon="▶" title="YouTube" text="방송과 영상을 만나보세요" onClick={() => go(CHANNEL)}/>
            <LinkCard icon="💛" title="Toonation" text="현주님에게 응원 보내기" onClick={() => go(TOONATION)}/>
            <LinkCard icon="💬" title="오픈채팅" text="함께 이야기해요" onClick={() => go(OPEN_CHAT)}/>
            <LinkCard icon="📷" title="Instagram" text="현주님의 일상을 만나보세요" onClick={() => go(INSTAGRAM)}/>
            <LinkCard icon="🧵" title="Threads" text="소소한 이야기를 만나보세요" onClick={() => go(THREADS)}/>
          </section>

          <section className="notice-banner">
            <div className="notice-symbol">🔔</div>
            <div><span className="section-label">LIVE NOTIFICATION</span><h2>현주님이 방송을 시작하면 알려드릴게요.</h2><p>이 기기에서 방송 알림을 받을 수 있도록 설정할 수 있어요.</p></div>
            <button onClick={() => openPage("settings")} type="button">알림 설정 →</button>
          </section>

          {data.error && <p className="error">{data.error}</p>}
        </main>
      )}

      {page === "videos" && (
        <main className="container sub-page">
          <PageHeader emoji="🎥" title="영상" text="현주님의 최근 YouTube 영상을 모아봤어요." back={() => openPage("home")}/>
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
        <div><strong>현주님의 작은 우주</strong><span>HYEONJU'S LITTLE UNIVERSE</span></div>
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
