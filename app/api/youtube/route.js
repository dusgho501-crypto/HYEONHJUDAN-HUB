const CHANNEL_ID =
  process.env.YOUTUBE_CHANNEL_ID ||
  "UCltJz_jkCxQxd2mTqrn3Lfg";

const API_KEY = process.env.YOUTUBE_API_KEY;

export const revalidate = 300;

async function youtube(url) {
  const response = await fetch(url, {
    next: {
      revalidate: 300,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `YouTube API 오류 (${response.status})`
    );
  }

  return data;
}

export async function GET() {
  try {
    if (!API_KEY) {
      throw new Error("YOUTUBE_API_KEY가 설정되지 않았습니다.");
    }

    // 채널 정보에서 업로드 재생목록 ID 확인
    const channelUrl =
      "https://www.googleapis.com/youtube/v3/channels?" +
      new URLSearchParams({
        part: "contentDetails",
        id: CHANNEL_ID,
        key: API_KEY,
      }).toString();

    const channelData = await youtube(channelUrl);

    const uploadsPlaylistId =
      channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      throw new Error(
        "YouTube 업로드 재생목록을 찾을 수 없습니다."
      );
    }

    // 최신 업로드 가져오기
    const playlistUrl =
      "https://www.googleapis.com/youtube/v3/playlistItems?" +
      new URLSearchParams({
        part: "snippet,contentDetails",
        playlistId: uploadsPlaylistId,
        maxResults: "10",
        key: API_KEY,
      }).toString();

    const playlistData = await youtube(playlistUrl);

    const videoIds = (playlistData?.items || [])
      .map((item) => item?.contentDetails?.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) {
      return Response.json({
        loading: false,
        videos: [],
        live: null,
        error: null,
      });
    }

    // 영상 상세 정보
    const videosUrl =
      "https://www.googleapis.com/youtube/v3/videos?" +
      new URLSearchParams({
        part: "snippet,statistics,liveStreamingDetails",
        id: videoIds.join(","),
        key: API_KEY,
      }).toString();

    const videosData = await youtube(videosUrl);

    const videoMap = new Map(
      (videosData?.items || []).map((video) => [
        video.id,
        video,
      ])
    );

    const videos = videoIds
      .map((id) => {
        const video = videoMap.get(id);

        if (!video) return null;

        return {
          id: video.id,
          title:
            video.snippet?.title ||
            "제목 없음",
          thumbnail:
            video.snippet?.thumbnails?.high?.url ||
            video.snippet?.thumbnails?.medium?.url ||
            video.snippet?.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
          publishedAt:
            video.snippet?.publishedAt ||
            null,
          views:
            video.statistics?.viewCount ||
            "0",
          url:
            `https://www.youtube.com/watch?v=${video.id}`,
          liveBroadcastContent:
            video.snippet?.liveBroadcastContent ||
            "none",
          liveStreamingDetails:
            video.liveStreamingDetails ||
            null,
        };
      })
      .filter(Boolean);

    const liveVideo = videos.find((video) => {
      if (video.liveBroadcastContent === "live") {
        return true;
      }

      const details = video.liveStreamingDetails;

      return Boolean(
        details?.actualStartTime &&
        !details?.actualEndTime
      );
    });

    const live = liveVideo
      ? {
          id: liveVideo.id,
          title: liveVideo.title,
          url: liveVideo.url,
          thumbnail: liveVideo.thumbnail,
          startedAt:
            liveVideo.liveStreamingDetails
              ?.actualStartTime || null,
        }
      : null;

    return Response.json({
      loading: false,
      videos,
      live,
      error: null,
    });
  } catch (error) {
    console.error("YouTube API 오류:", error);

    return Response.json(
      {
        loading: false,
        videos: [],
        live: null,
        error:
          error?.message ||
          "YouTube 데이터를 불러오지 못했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
