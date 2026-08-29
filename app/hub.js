"use client";
import {useEffect,useState} from "react";
import "./style.css";

const CHANNEL = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL;
const TOONATION = process.env.NEXT_PUBLIC_TOONATION_URL;

export default function Hub(){
  const [data,setData]=useState({loading:true,videos:[],live:null,error:null});
  const [page,setPage]=useState("home");

  useEffect(()=>{ fetch("/api/youtube").then(r=>r.json()).then(setData).catch(e=>setData({loading:false,error:e.message,videos:[],live:null})); },[]);

useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(console.error);
  }
}, []);

  const go=url=>window.open(url,"_blank","noopener,noreferrer");
  const fmt=d=>d?new Date(d).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}):"";

  return <div className="app">
    <header className="hero">
      <button className="bell" onClick={()=>setPage("settings")}>🔔</button>
      <div className="avatar">💜</div><h1>현주님 HUB</h1>
      <p>현주님의 모든 소식을 한 곳에서 💜</p>
    </header>
    <main>
      {page==="home" && <>
        <section className={"card live "+(data.live?"on":"")}>
          <div className="liveTop"><span className="dot"></span>{data.live?"LIVE":"LIVE"}<span className="badge">{data.live?"지금 방송 중!":"현재 방송 없음"}</span></div>
          <h2>{data.live?.title || "현주님의 다음 방송을 기다려요"}</h2>
          <p>{data.live ? "지금 바로 만나보세요 ✨" : "새 라이브가 시작되면 이곳에 자동으로 표시됩니다."}</p>
          <button className="primary" onClick={()=>go(data.live?.url||CHANNEL)}>{data.live?"🔴 라이브 보러가기 →":"▶️ YouTube 채널 보기 →"}</button>
        </section>

        <section className="card channel"><div><b>▶️ 현주님 YouTube</b><small>실제 채널과 연결됨</small></div><button onClick={()=>go(CHANNEL)}>채널 열기 ↗</button></section>

        <section className="card">
          <div className="title">🎥 최신 영상 <button onClick={()=>setPage("videos")}>더보기 ›</button></div>
          {data.loading?<div className="skeleton"/>:data.videos.slice(0,3).map(v=><Video key={v.id} v={v} go={go} fmt={fmt}/>)}
          {data.error && <p className="error">YouTube API 연결 준비가 필요합니다: {data.error}</p>}
        </section>

        <section className="card post">
          <div className="title">📝 게시물 <button onClick={()=>go(CHANNEL+"/community")}>YouTube에서 보기 ›</button></div>
          <p><b>커뮤니티 게시물 자동 연동 준비 영역</b></p>
          <p className="muted">YouTube Data API에서 일반 영상과 같은 방식으로 커뮤니티 게시물을 안정적으로 제공하지 않으므로, 이 V3에서는 우선 실제 커뮤니티 페이지로 연결합니다.</p>
        </section>

        <section className="card support"><div><b>💛 투네이션 후원</b><small>현주님에게 응원을 보내주세요</small></div><button onClick={()=>go(TOONATION)}>후원하기 ↗</button></section>

        <section className="card news"><div className="title">🔔 최근 소식</div>
          {data.live&&<Item icon="🔴" title="라이브 시작" text={data.live.title} time="현재"/>}
          {data.videos.slice(0,3).map(v=><Item key={v.id} icon="▶️" title="새 영상" text={v.title} time={fmt(v.publishedAt)}/>)}
        </section>
      </>}

      {page==="videos" && <><Back setPage={setPage}/><h2>🎥 영상</h2>{data.videos.map(v=><section className="card" key={v.id}><Video v={v} go={go} fmt={fmt}/></section>)}</>}
      {page==="settings" && <><Back setPage={setPage}/><h2>🔔 알림 설정</h2><section className="card"><Setting t="🔴 라이브 시작"/><Setting t="🎥 새 영상"/><Setting t="📝 새 게시물"/><p className="muted">현재는 UI 프로토타입입니다. 실제 푸시 알림은 HTTPS, 브라우저 권한, Push/Service Worker와 서버 이벤트 감지를 추가해야 합니다.</p></section></>}
    </main>
    <nav><button className={page==="home"?"active":""} onClick={()=>setPage("home")}>⌂<small>홈</small></button><button className={page==="videos"?"active":""} onClick={()=>setPage("videos")}>▶<small>영상</small></button><button onClick={()=>go(CHANNEL+"/community")}>▢<small>게시물</small></button><button onClick={()=>go(TOONATION)}>♡<small>후원</small></button></nav>
  </div>
}
function Video({v,go,fmt}){return <div className="video" onClick={()=>go(v.url)}><img src={v.thumbnail} /><div><h3>{v.title}</h3><span>{fmt(v.publishedAt)} · 조회수 {v.views??"-"}</span></div></div>}
function Item({icon,title,text,time}){return <div className="item"><i>{icon}</i><div><b>{title}</b><small>{text}</small></div><em>{time}</em></div>}
function Setting({t}){
  const [on,setOn]=useState(false);

  const toggle=async()=>{
    if(on){
      setOn(false);
      return;
    }

    if(!("Notification" in window)){
      alert("이 브라우저에서는 알림을 지원하지 않습니다.");
      return;
    }

    const permission=await Notification.requestPermission();

    if(permission==="granted"){
      setOn(true);
    }else{
      alert("알림 권한이 허용되지 않았습니다.");
    }
  };

  return (
    <div className="setting">
      <b>{t}</b>
      <button
        className={"switch "+(on?"on":"")}
        onClick={toggle}
      >
        <span/>
      </button>
    </div>
  );
}