import { NextResponse } from "next/server";
import webpush from "web-push";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (publicKey && privateKey && subject) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

// 임시 저장소
// Vercel 서버리스에서는 영구 저장이 아니므로,
// 다음 단계에서 실제 DB 저장으로 바꿀 예정입니다.
let subscriptions = [];

export async function POST(request) {
  try {
    if (!publicKey || !privateKey || !subject) {
      return NextResponse.json(
        { ok: false, error: "VAPID 환경변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const subscription = await request.json();

    if (!subscription?.endpoint) {
      return NextResponse.json(
        { ok: false, error: "Push subscription이 없습니다." },
        { status: 400 }
      );
    }

    const exists = subscriptions.some(
      (item) => item.endpoint === subscription.endpoint
    );

    if (!exists) {
      subscriptions.push(subscription);
    }

    return NextResponse.json({
      ok: true,
      message: "알림 구독이 저장되었습니다.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}