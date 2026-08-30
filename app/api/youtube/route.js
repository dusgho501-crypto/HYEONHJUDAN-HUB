import { NextResponse } from "next/server";

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

const CACHE_SECONDS = 300;

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
    },
  });
}

async function youtubeFetch(endpoint, params) {
  const url = new URL(
    `https://www.googleapis.com/youtube/v3/${endpoint}`
  );

  Object.entries({
    ...params,
    key: API_KEY,
  }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    next: {
      revalidate: CACHE_SECONDS,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message ||
      "YouTube API 요청에 실패했습니다.";

    const error = new Error(message);
    error.status = response.status;
    error.reason =
      data?.error?.errors?.[0]?.reason || "";
    throw error;
  }

  return data;
}

export async function GET() {
  try {
    if (!API_KEY) {
      return json(
        {
          loading: false,
          videos: [],
          live: null,
          error: "YOUTUBE_API_KEY가 설정되지 않았습니다.",
        },
        500
      );
    }

    if (!CHANNEL_ID) {
      return json(
        {
          loading: false,
          videos: [],
          live: null,
          error: "YOUTUBE_CHANNEL_ID가 설정되지 않았습니다.",
        },
        500
      );
    }

    /*
     * 중요:
     * search.list를 사용하지 않습니다.
     *
     * 채널 ID:
     * UCxxxxxxxx...
     *
     * 업로드 플레이리스트:
     * UUxxxxxxxx...
     *
     * 따라서 채널 ID의 UC를 UU로 바꾸면
     * 업로드 플레이리스트 ID를 만들 수 있습니다.
     */
    const uploadsPlaylistId =
      CHANNEL_ID.startsWith("UC")
        ? "UU" + CHANNEL_ID.slice(2)
        : null;

    if (!uploadsPlaylistId) {
      return json(
        {
          loading: false,
          videos: [],
          live: null,
          error: "올바른 YouTube 채널 ID가 아닙니다.",
        },
        400
      );
    }

    /*
     * 1번째 API 호출
     * playlistItems.list
     *
     * 최신 업로드 10개만 가져옵니다.
     * search.list를 사용하지 않으므로 Search Queries quota를
     * 사용하지 않습니다.
     */
    const playlistData = await youtubeFetch(
      "playlistItems",
      {
        part: "snippet",
        playlistId: uploadsPlaylistId,
        maxResults: "10",
      }
    );

    const playlistItems = Array.isArray(playlistData.items)
      ? playlistData.items
      : [];

    const videoIds = playlistItems
      .map((item) => item?.snippet?.resourceId?.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) {
      return json({
        loading: false,
        videos: [],
        live: null,
        error: null,
      });
    }

    /*
     * 2번째 API 호출
     * videos.list
     *
     * 여러 영상 ID를 한 번에 가져옵니다.
     * 조회수와 현재 라이브 여부도 여기서 확인합니다.
     */
    const videoData = await youtubeFetch(
      "videos",
      {
        part: "snippet,statistics,liveStreamingDetails",
        id: videoIds.join(","),
      }
    );

    const apiVideos = Array.isArray(videoData.items)
      ? videoData.items
      : [];

    const videosById = new Map(
      apiVideos.map((video) => [video.id, video])
    );

    const videos = playlistItems
      .map((item) => {
        const id =
          item?.snippet?.resourceId?.videoId;

        const video = videosById.get(id);

        if (!id || !video) {
          return null;
        }

        return {
          id,
          title:
            video?.snippet?.title ||
            item?.snippet?.title ||
            "제목 없음",

          thumbnail:
            video?.snippet?.thumbnails?.high?.url ||
            video?.snippet?.thumbnails?.medium?.url ||
            video?.snippet?.thumbnails?.default?.url ||
            "",

          publishedAt:
            video?.snippet?.publishedAt ||
            item?.snippet?.publishedAt ||
            null,

          views:
            video?.statistics?.viewCount ?? null,

          url:
            `https://www.youtube.com/watch?v=${id}`,
        };
      })
      .filter(Boolean);

    /*
     * 현재 라이브 확인
     *
     * search.list를 사용하지 않습니다.
     *
     * 최근 업로드 중 liveStreamingDetails가 있고
     * actualStartTime은 있지만 actualEndTime이 없으면
     * 현재 방송 중으로 판단합니다.
     */
    let live = null;

    for (const video of apiVideos) {
      const details =
        video?.liveStreamingDetails;

      if (
        details?.actualStartTime &&
        !details?.actualEndTime
      ) {
        live = {
          id: video.id,
          title:
            video?.snippet?.title ||
            "현주님 라이브",
          url:
            `https://www.youtube.com/watch?v=${video.id}`,
        };

        break;
      }
    }

    return json({
      loading: false,
      videos,
      live,
      error: null,
    });
  } catch (error) {
    console.error("YouTube API error:", error);

    /*
     * quota 초과 등의 오류가 발생해도
     * 빨간색 Google 오류 메시지를 그대로 화면에 노출하지 않습니다.
     */
    const isQuotaError =
      error?.reason === "quotaExceeded" ||
      error?.status === 403 ||
      String(error?.message || "")
        .toLowerCase()
        .includes("quota");

    return json({
      loading: false,
      videos: [],
      live: null,
      error: isQuotaError
        ? "YouTube 최신 정보를 잠시 불러오지 못하고 있습니다."
        : "YouTube 최신 정보를 불러오지 못했습니다.",
    });
  }
}
