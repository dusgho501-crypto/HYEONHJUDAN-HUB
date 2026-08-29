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
    key: YOUTUBE_API_KEY
  }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    cache: "no-store"
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "YouTube API 오류"
    );
  }

  return data;
}

async function initDatabase() {
  if (!sql) {
    throw new Error(
      "DATABASE_URL이 설정되지 않았습니다."
    );
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
          url
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
    failed
  };
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
      Vercel Cron 보안

      CRON_SECRET을 설정한 경우:
      Authorization: Bearer CRON_SECRET
      헤더가 있어야 실행됩니다.

      로컬 테스트에서는 CRON_SECRET이 없으면
      별도 인증 없이 실행됩니다.
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
            error: "Unauthorized"
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
      최근 영상 확인
    */

    const videos = await youtube(
      "search",
      {
        part: "snippet",
        channelId: CHANNEL_ID,
        order: "date",
        type: "video",
        maxResults: 5
      }
    );

    const newVideos = [];

    for (const item of videos.items || []) {
      const videoId = item.id?.videoId;

      if (!videoId) continue;

      const title =
        item.snippet?.title ||
        "새 영상이 올라왔어요!";

      const exists =
        await alreadyNotified(videoId);

      if (!exists) {
        await saveNotification(
          videoId,
          "video",
          title
        );

        newVideos.push({
          id: videoId,
          title
        });
      }
    }

    /*
      현재 LIVE 확인
    */

    const liveSearch = await youtube(
      "search",
      {
        part: "snippet",
        channelId: CHANNEL_ID,
        eventType: "live",
        type: "video",
        maxResults: 1
      }
    );

    let live = null;

    if (liveSearch.items?.[0]) {
      const item =
        liveSearch.items[0];

      const videoId =
        item.id?.videoId;

      const title =
        item.snippet?.title ||
        "현주님이 지금 방송 중이에요!";

      if (videoId) {
        live = {
          id: videoId,
          title
        };

        const exists =
          await alreadyNotified(videoId);

        if (!exists) {
          await saveNotification(
            videoId,
            "live",
            title
          );

          await sendPush(
            "🔴 현주님 LIVE 시작!",
            title,
            `https://www.youtube.com/watch?v=${videoId}`
          );
        }
      }
    }

    /*
      새 영상 알림
    */

    const pushResults = [];

    for (const video of newVideos) {
      const result = await sendPush(
        "🎥 현주님 새 영상!",
        video.title,
        `https://www.youtube.com/watch?v=${video.id}`
      );

      pushResults.push({
        video: video.id,
        ...result
      });
    }

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      newVideos,
      live,
      pushResults
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}