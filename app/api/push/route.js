import { NextResponse } from "next/server";
import webpush from "web-push";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (publicKey && privateKey && subject) {
  webpush.setVapidDetails(
    subject,
    publicKey,
    privateKey
  );
}

// 현재는 테스트용 임시 저장소
let subscriptions = [];

export async function POST(request) {
  try {
    if (!publicKey || !privateKey || !subject) {
      return NextResponse.json(
        {
          ok: false,
          error: "VAPID 환경변수가 설정되지 않았습니다."
        },
        { status: 500 }
      );
    }

    const subscription = await request.json();

    if (!subscription?.endpoint) {
      return NextResponse.json(
        {
          ok: false,
          error: "Push subscription이 없습니다."
        },
        { status: 400 }
      );
    }

    const exists = subscriptions.some(
      item => item.endpoint === subscription.endpoint
    );

    if (!exists) {
      subscriptions.push(subscription);
    }

    return NextResponse.json({
      ok: true,
      message: "알림 구독이 저장되었습니다."
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


// 🔔 테스트 알림 발송
export async function GET() {
  try {
    if (!publicKey || !privateKey || !subject) {
      return NextResponse.json(
        {
          ok: false,
          error: "VAPID 환경변수가 설정되지 않았습니다."
        },
        { status: 500 }
      );
    }

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "등록된 알림 구독이 없습니다."
        },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title: "현주님 HUB 💜",
      body: "🔔 테스트 알림이 도착했어요!",
      url: "/"
    });

    const results = [];

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          subscription,
          payload
        );

        results.push({
          ok: true
        });

      } catch (error) {
        console.error(
          "Push 발송 실패:",
          error
        );

        results.push({
          ok: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: "테스트 알림을 발송했습니다.",
      results
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