import { NextResponse } from "next/server";
import webpush from "web-push";
import { neon } from "@neondatabase/serverless";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID =
  process.env.YOUTUBE_CHANNEL_ID || "UCltJz_jkCxQxd2mTqrn3Lfg";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;

const DATABASE_URL = process.env.DATABASE_URL;
const CRON_SECRET = process.env.CRON_SECRET;

const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

if (
  VAPID_PUBLIC_KEY &&
  VAPID_PRIVATE_KEY &&
  VAPID_SUBJECT
) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

async function youtube(path, params) {
  const url = new URL(
    `https://www.googleapis.com/youtube/v3/${path}`
  );

  Object.entries({
    ...params,
    key: YOUTUBE_API_KEY,
  }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "YouTube API 요청에 실패했습니다."
    );
  }

  return data;
}

async function initDatabase() {
  if (!sql) {
    throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  }

  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      endpoint TEXT UNIQUE NOT NULL,
      subscription JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS youtube_notifications (
      id SERIAL PRIMARY KEY,
      youtube_id TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      title TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

async function sendPush(title, body, url) {
  const rows = await sql`
    SELECT id, endpoint, subscription
    FROM push_subscriptions
  `;

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await webpush.sendNotification(
        row.subscription,
        JSON.stringify({
          title,
          body,
          url,
        })
      );

      sent++;
    } catch (error) {
      failed++;

      console.error(
        "Push 발송 실패:",
        error.message
      );

      if (
        error.statusCode === 404 ||
        error.statusCode === 410
      ) {
        await sql`
          DELETE FROM push_subscriptions
          WHERE id = ${row.id}
        `;
      }
    }
  }

  return {
    subscribers: rows.length,
    sent,
    failed,
  };
}

async function hasAnyNotifications() {
  const rows = await sql`
    SELECT id
    FROM youtube_notifications
    LIMIT 1
  `;

  return rows.length > 0;
}

async function alreadyNotified(youtubeId) {
  const rows = await sql`
    SELECT id
    FROM youtube_notifications
    WHERE youtube_id = ${youtubeId}
    LIMIT 1
  `;

  return rows.length > 0;
}

async function saveNotification(
  youtubeId,
  type,
  title
) {
  await sql`
    INSERT INTO youtube_notifications (
      youtube_id,
      type,
      title
    )
    VALUES (
      ${youtubeId},
      ${type},
      ${title}
    )
    ON CONFLICT (youtube_id)
    DO NOTHING
  `;
}

export async function GET(request) {
  try {
    /*
     * cron-job.org 또는 Vercel Cron 인증
     */
    if (CRON_SECRET) {
      const authorization =
        request.headers.get("authorization");

      if (
        authorization !==
        `Bearer ${CRON_SECRET}`
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "Unauthorized",
          },
          { status: 401 }
        );
      }
    }

    if (!YOUTUBE_API_KEY) {
      throw new Error(
        "YOUTUBE_API_KEY가 설정되지 않았습니다."
      );
    }

    if (!DATABASE_URL) {
      throw new Error(
        "DATABASE_URL이 설정되지 않았습니다."
      );
    }

    if (
      !VAPID_PUBLIC_KEY ||
      !VAPID_PRIVATE_KEY ||
      !VAPID_SUBJECT
    ) {
      throw new Error(
        "VAPID 환경변수가 설정되지 않았습니다."
      );
    }

    await initDatabase();

    /*
     * 중요:
     * search.list를 사용하지 않습니다.
     *
     * 채널의 업로드 플레이리스트에서
     * 최근 영상 10개를 가져옵니다.
     *
     * Search Queries quota를 사용하지 않습니다.
     */
    const uploadsPlaylistId =
      CHANNEL_ID.startsWith("UC")
        ? "UU" + CHANNEL_ID.slice(2)
        : null;

    if (!uploadsPlaylistId) {
      throw new Error(
        "올바른 YouTube 채널 ID가 아닙니다."
      );
    }

    const playlistData = await youtube(
      "playlistItems",
      {
        part: "snippet",
        playlistId: uploadsPlaylistId,
        maxResults: 10,
      }
    );

    const playlistItems =
      Array.isArray(playlistData.items)
        ? playlistData.items
        : [];

    const videoIds = playlistItems
      .map(
        (item) =>
          item?.snippet?.resourceId?.videoId
      )
      .filter(Boolean);

    if (videoIds.length === 0) {
      return NextResponse.json({
        ok: true,
        checkedAt: new Date().toISOString(),
        newVideos: [],
        live: null,
        pushResults: [],
      });
    }

    /*
     * 영상 상세정보 + LIVE 상태
     *
     * videos.list 1회로 일괄 조회합니다.
     */
    const videoData = await youtube(
      "videos",
      {
        part: "snippet,liveStreamingDetails",
        id: videoIds.join(","),
      }
    );

    const apiVideos =
      Array.isArray(videoData.items)
        ? videoData.items
        : [];

    const videosById = new Map(
      apiVideos.map((video) => [
        video.id,
        video,
      ])
    );

    /*
 * 새 영상 확인
 *
 * 최초 실행 시 기존 영상은 기록만 하고
 * 알림을 발송하지 않습니다.
 */
const isInitializing = !(await hasAnyNotifications());
const newVideos = [];

for (const item of playlistItems) {
  const videoId =
    item?.snippet?.resourceId?.videoId;

  if (!videoId) continue;

  const video = videosById.get(videoId);

  const title =
    video?.snippet?.title ||
    item?.snippet?.title ||
    "새 영상";

  const details =
    video?.liveStreamingDetails;

  const isLive =
    details?.actualStartTime &&
    !details?.actualEndTime;

  // LIVE 영상은 아래 LIVE 전용 로직에서 처리합니다.
  if (isLive) continue;

  const exists =
    await alreadyNotified(videoId);

  if (!exists) {
    await saveNotification(
      videoId,
      "video",
      title
    );

    // 최초 실행에서는 기존 영상 알림을 보내지 않습니다.
    if (!isInitializing) {
      newVideos.push({
        id: videoId,
        title,
      });
    }
  }
}
/*
     * 현재 LIVE 확인
     *
     * search.list를 사용하지 않습니다.
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
            "현주님 LIVE 방송 중",
        };

        const exists =
          await alreadyNotified(video.id);

        if (!exists) {
          await saveNotification(
            video.id,
            "live",
            live.title
          );

          await sendPush(
            "🔴 현주님 LIVE 시작!",
            live.title,
            `https://www.youtube.com/watch?v=${video.id}`
          );
        }

        break;
      }
    }

    /*
     * 새 영상 알림
     */
    const pushResults = [];

    for (const video of newVideos) {
      const result = await sendPush(
        "📺 현주님 새 영상!",
        video.title,
        `https://www.youtube.com/watch?v=${video.id}`
      );

      pushResults.push({
        video: video.id,
        ...result,
      });
    }

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      newVideos,
      live,
      pushResults,
    });
  } catch (error) {
    console.error(
      "YouTube check error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "YouTube 확인 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
