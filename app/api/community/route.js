import { NextResponse } from "next/server";

const API_KEY = process.env.SOCIALCRAWL_API_KEY;
const CHANNEL_ID = "UCltJz_jkCxQxd2mTqrn3Lfg";

export async function GET() {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "SOCIALCRAWL_API_KEY가 설정되지 않았습니다.",
        },
        { status: 500 }
      );
    }

    const url = new URL(
      "https://www.socialcrawl.dev/v1/youtube/channel/community-posts"
    );

    url.searchParams.set("channelId", CHANNEL_ID);

    const response = await fetch(url, {
      headers: {
        "x-api-key": API_KEY,
        Accept: "application/json",
      },
      next: {
        revalidate: 600,
      },
    });

    const json = await response.json();

    if (!response.ok || !json?.success) {
      return NextResponse.json(
        {
          ok: false,
          error:
            json?.error?.message ||
            "SocialCrawl Community Posts 요청에 실패했습니다.",
        },
        { status: response.status || 500 }
      );
    }

    const posts = (json?.data?.items || [])
      .map((item) => {
        const post = item?.post || {};
        const content = post?.content || {};
        const engagement = post?.engagement || {};

        return {
          id: post.id || "",
          url: post.url || "",
          text: content.text || "",
          images: Array.isArray(content.media_urls)
            ? content.media_urls.slice(0, 3)
            : [],
          thumbnail: content.thumbnail_url || null,
          likes: engagement.likes ?? null,
          publishedAt: post.published_at || null,
          publishedLabel: post?.ext?.published_label || null,
        };
      })
      .filter((post) => post.id && post.url)
      .slice(0, 3);

    return NextResponse.json({
      ok: true,
      posts,
      cached: Boolean(json.cached),
      creditsUsed: json.credits_used ?? 0,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Community Posts error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "YouTube 게시물을 불러오는 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}