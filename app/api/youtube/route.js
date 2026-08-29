import {NextResponse} from "next/server";

const key=process.env.YOUTUBE_API_KEY;
const channelId=process.env.YOUTUBE_CHANNEL_ID || "UCltJz_jkCxQxd2mTqrn3Lfg";

async function yt(path, params){
  const u=new URL("https://www.googleapis.com/youtube/v3/"+path);
  Object.entries({...params,key}).forEach(([k,v])=>u.searchParams.set(k,v));
  const r=await fetch(u,{next:{revalidate:120}});
  const j=await r.json();
  if(!r.ok) throw new Error(j?.error?.message||"YouTube API 오류");
  return j;
}
export async function GET(){
  if(!key) return NextResponse.json({loading:false,videos:[],live:null,error:"YOUTUBE_API_KEY가 설정되지 않았습니다."});
  try{
    const ch=await yt("channels",{part:"snippet,contentDetails",id:channelId});
    const uploads=ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if(!uploads) throw new Error("채널 정보를 찾지 못했습니다.");
    const pl=await yt("playlistItems",{part:"snippet,contentDetails",playlistId:uploads,maxResults:10});
    const ids=pl.items.map(x=>x.contentDetails.videoId).filter(Boolean).join(",");
    let stats={};
    if(ids){
      const v=await yt("videos",{part:"snippet,statistics",id:ids});
      for(const x of v.items) stats[x.id]=x;
    }
    const videos=pl.items.map(x=>{
      const id=x.contentDetails.videoId, s=stats[id];
      return {id,title:x.snippet.title,thumbnail:x.snippet.thumbnails?.high?.url||x.snippet.thumbnails?.medium?.url,publishedAt:x.snippet.publishedAt,views:s?.statistics?.viewCount?Number(s.statistics.viewCount).toLocaleString("ko-KR"):null,url:`https://www.youtube.com/watch?v=${id}`};
    });
    let live=null;
    // Public live detection uses search.list. It is intentionally isolated so it can be replaced
    // by an OAuth/liveBroadcasts implementation if the channel owner authorizes the app.
    const search=await yt("search",{part:"snippet",channelId,eventType:"live",type:"video",maxResults:1});
    if(search.items?.[0]){
      const x=search.items[0];
      live={id:x.id.videoId,title:x.snippet.title,url:`https://www.youtube.com/watch?v=${x.id.videoId}`};
    }
    return NextResponse.json({loading:false,videos,live,error:null});
  }catch(e){return NextResponse.json({loading:false,videos:[],live:null,error:e.message},{status:200});}
}