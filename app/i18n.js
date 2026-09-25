"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const LANGUAGE_OPTIONS = [
  ["ko", "한국어"],
  ["en", "English"],
  ["ja", "日本語"],
  ["zh", "中文"],
  ["fr", "Français"],
  ["de", "Deutsch"]
];

export const MESSAGES = {
  "ko": {
    "nav.home": "홈",
    "nav.videos": "영상",
    "nav.post": "Post",
    "nav.support": "후원",
    "nav.notification": "알림 설정",
    "brand.title": "현주의스토리.zip",
    "brand.tagline": "현주의 모든 순간을 한곳에 📦",
    "menu.all": "전체 메뉴",
    "menu.home": "홈",
    "menu.videos": "최근 영상",
    "menu.news": "현주님의 소식",
    "menu.notification": "방송 알림",
    "section.recentVideos": "최근 영상",
    "section.news": "현주님의 소식",
    "section.recentLives": "최근 방송",
    "section.links": "현주님 링크",
    "action.watchLive": "🔴 지금 방송 보기",
    "action.youtubeChannel": "▶ YouTube 채널 보기",
    "action.viewBroadcast": "방송 보러가기 →",
    "action.viewChannel": "채널 보기 →",
    "action.viewAllVideos": "전체 영상 보기 →",
    "action.viewAllPosts": "YouTube에서 전체 보기 →",
    "action.notifications": "알림 설정 →",
    "notice.title": "현주님이 방송을 시작하면 알려드릴게요.",
    "notice.description": "이 기기에서 방송 알림을 받을 수 있도록 설정할 수 있어요.",
    "videos.title": "영상",
    "videos.description": "현주님의 최근 YouTube 영상을 모아봤어요.",
    "links.titleYoutube": "유튜브",
    "links.titleToonation": "투네이션",
    "links.titleOpenChat": "오픈채팅",
    "links.titleInstagram": "인스타그램",
    "links.titleThreads": "스레드",
    "links.youtube": "방송과 영상을 만나보세요",
    "links.toonation": "현주님에게 응원 보내기",
    "links.openChat": "함께 이야기해요",
    "links.instagram": "현주님의 일상을 만나보세요",
    "links.threads": "소소한 이야기를 만나보세요",
    "empty.videos": "표시할 영상이 없습니다.",
    "history.title": "방송 기록",
    "history.empty": "최근 방송 기록을 불러오는 중이거나 없습니다.",
    "live.noLive": "지금은 방송이 없어요",
    "live.waiting": "다음 방송을 기다리는 중이에요.",
    "live.willAppear": "방송이 시작되면 이곳에 바로 표시됩니다."
  },
  "en": {
    "nav.home": "Home",
    "nav.videos": "Videos",
    "nav.post": "Post",
    "nav.support": "Support",
    "nav.notification": "Notifications",
    "brand.title": "Hyeonju's Story.zip",
    "brand.tagline": "All of Hyeonju's moments in one place 📦",
    "menu.all": "Menu",
    "menu.home": "Home",
    "menu.videos": "Recent Videos",
    "menu.news": "Hyeonju's Updates",
    "menu.notification": "Broadcast Notifications",
    "section.recentVideos": "Recent Videos",
    "section.news": "Hyeonju's Updates",
    "section.recentLives": "Recent Broadcasts",
    "section.links": "Hyeonju's Links",
    "action.watchLive": "🔴 Watch Live",
    "action.youtubeChannel": "▶ YouTube Channel",
    "action.viewBroadcast": "Watch Broadcast →",
    "action.viewChannel": "View Channel →",
    "action.viewAllVideos": "View All Videos →",
    "action.viewAllPosts": "View All on YouTube →",
    "action.notifications": "Notifications →",
    "notice.title": "We'll let you know when Hyeonju goes live.",
    "notice.description": "Turn on broadcast notifications on this device.",
    "videos.title": "Videos",
    "videos.description": "Here are Hyeonju's latest YouTube videos.",
    "links.titleYoutube": "YouTube",
    "links.titleToonation": "Toonation",
    "links.titleOpenChat": "Open Chat",
    "links.titleInstagram": "Instagram",
    "links.titleThreads": "Threads",
    "links.youtube": "Watch broadcasts and videos",
    "links.toonation": "Send support to Hyeonju",
    "links.openChat": "Let's chat together",
    "links.instagram": "See Hyeonju's daily life",
    "links.threads": "See her little stories",
    "empty.videos": "No videos to display.",
    "history.title": "Broadcast Record",
    "history.empty": "No recent broadcast records.",
    "live.noLive": "No live stream right now",
    "live.waiting": "Waiting for the next broadcast.",
    "live.willAppear": "The live stream will appear here when it starts."
  },
  "ja": {
    "nav.home": "ホーム",
    "nav.videos": "動画",
    "nav.post": "投稿",
    "nav.support": "応援",
    "nav.notification": "通知設定",
    "brand.title": "ヒョンジュのStory.zip",
    "brand.tagline": "ヒョンジュのすべての瞬間をここに 📦",
    "menu.all": "メニュー",
    "menu.home": "ホーム",
    "menu.videos": "最新動画",
    "menu.news": "ヒョンジュのお知らせ",
    "menu.notification": "配信通知",
    "section.recentVideos": "最新動画",
    "section.news": "ヒョンジュのお知らせ",
    "section.recentLives": "最近の配信",
    "section.links": "ヒョンジュのリンク",
    "action.watchLive": "🔴 配信を見る",
    "action.youtubeChannel": "▶ YouTubeチャンネル",
    "action.viewBroadcast": "配信を見る →",
    "action.viewChannel": "チャンネルを見る →",
    "action.viewAllVideos": "すべての動画を見る →",
    "action.viewAllPosts": "YouTubeですべて見る →",
    "action.notifications": "通知設定 →",
    "notice.title": "ヒョンジュが配信を始めたらお知らせします。",
    "notice.description": "この端末で配信通知を設定できます。",
    "videos.title": "動画",
    "videos.description": "ヒョンジュの最新YouTube動画をまとめました。",
    "links.titleYoutube": "YouTube",
    "links.titleToonation": "Toonation",
    "links.titleOpenChat": "オープンチャット",
    "links.titleInstagram": "Instagram",
    "links.titleThreads": "Threads",
    "links.youtube": "配信と動画を見る",
    "links.toonation": "ヒョンジュを応援する",
    "links.openChat": "みんなでお話ししましょう",
    "links.instagram": "ヒョンジュの日常を見る",
    "links.threads": "日々の小さな話を見る",
    "empty.videos": "表示できる動画がありません。",
    "history.title": "配信履歴",
    "history.empty": "最近の配信履歴はありません。",
    "live.noLive": "現在配信していません",
    "live.waiting": "次の配信を待っています。",
    "live.willAppear": "配信が始まるとここに表示されます。"
  },
  "zh": {
    "nav.home": "首页",
    "nav.videos": "视频",
    "nav.post": "帖子",
    "nav.support": "支持",
    "nav.notification": "通知设置",
    "brand.title": "贤珠的Story.zip",
    "brand.tagline": "把贤珠的每个瞬间汇聚在这里 📦",
    "menu.all": "菜单",
    "menu.home": "首页",
    "menu.videos": "最新视频",
    "menu.news": "贤珠的消息",
    "menu.notification": "直播通知",
    "section.recentVideos": "最新视频",
    "section.news": "贤珠的消息",
    "section.recentLives": "最近直播",
    "section.links": "贤珠的链接",
    "action.watchLive": "🔴 观看直播",
    "action.youtubeChannel": "▶ YouTube频道",
    "action.viewBroadcast": "观看直播 →",
    "action.viewChannel": "查看频道 →",
    "action.viewAllVideos": "查看全部视频 →",
    "action.viewAllPosts": "在YouTube查看全部 →",
    "action.notifications": "通知设置 →",
    "notice.title": "贤珠开始直播时会通知你。",
    "notice.description": "可以在此设备上开启直播通知。",
    "videos.title": "视频",
    "videos.description": "这里整理了贤珠最新的YouTube视频。",
    "links.titleYoutube": "YouTube",
    "links.titleToonation": "Toonation",
    "links.titleOpenChat": "开放聊天",
    "links.titleInstagram": "Instagram",
    "links.titleThreads": "Threads",
    "links.youtube": "观看直播和视频",
    "links.toonation": "为贤珠送上支持",
    "links.openChat": "一起聊天吧",
    "links.instagram": "看看贤珠的日常",
    "links.threads": "看看她的小故事",
    "empty.videos": "暂无可显示的视频。",
    "history.title": "直播记录",
    "history.empty": "暂无最近直播记录。",
    "live.noLive": "目前没有直播",
    "live.waiting": "等待下一场直播。",
    "live.willAppear": "直播开始后会显示在这里。"
  },
  "fr": {
    "nav.home": "Accueil",
    "nav.videos": "Vidéos",
    "nav.post": "Publication",
    "nav.support": "Soutien",
    "nav.notification": "Notifications",
    "brand.title": "L'histoire de Hyeonju.zip",
    "brand.tagline": "Tous les moments de Hyeonju au même endroit 📦",
    "menu.all": "Menu",
    "menu.home": "Accueil",
    "menu.videos": "Vidéos récentes",
    "menu.news": "Actualités de Hyeonju",
    "menu.notification": "Notifications de live",
    "section.recentVideos": "Vidéos récentes",
    "section.news": "Actualités de Hyeonju",
    "section.recentLives": "Lives récents",
    "section.links": "Liens de Hyeonju",
    "action.watchLive": "🔴 Voir le live",
    "action.youtubeChannel": "▶ Chaîne YouTube",
    "action.viewBroadcast": "Voir le live →",
    "action.viewChannel": "Voir la chaîne →",
    "action.viewAllVideos": "Voir toutes les vidéos →",
    "action.viewAllPosts": "Tout voir sur YouTube →",
    "action.notifications": "Notifications →",
    "notice.title": "Nous vous préviendrons quand Hyeonju sera en direct.",
    "notice.description": "Activez les notifications sur cet appareil.",
    "videos.title": "Vidéos",
    "videos.description": "Voici les dernières vidéos YouTube de Hyeonju.",
    "links.titleYoutube": "YouTube",
    "links.titleToonation": "Toonation",
    "links.titleOpenChat": "Chat ouvert",
    "links.titleInstagram": "Instagram",
    "links.titleThreads": "Threads",
    "links.youtube": "Regarder les lives et les vidéos",
    "links.toonation": "Soutenir Hyeonju",
    "links.openChat": "Discutons ensemble",
    "links.instagram": "Découvrir le quotidien de Hyeonju",
    "links.threads": "Découvrir ses petites histoires",
    "empty.videos": "Aucune vidéo à afficher.",
    "history.title": "Historique des lives",
    "history.empty": "Aucun historique récent.",
    "live.noLive": "Pas de live actuellement",
    "live.waiting": "En attente du prochain live.",
    "live.willAppear": "Le live apparaîtra ici lorsqu'il commencera."
  },
  "de": {
    "nav.home": "Startseite",
    "nav.videos": "Videos",
    "nav.post": "Beitrag",
    "nav.support": "Unterstützen",
    "nav.notification": "Benachrichtigungen",
    "brand.title": "HyeonjUs Story.zip",
    "brand.tagline": "Alle Momente von Hyeonju an einem Ort 📦",
    "menu.all": "Menü",
    "menu.home": "Startseite",
    "menu.videos": "Neueste Videos",
    "menu.news": "HyeonjUs Neuigkeiten",
    "menu.notification": "Livestream-Benachrichtigungen",
    "section.recentVideos": "Neueste Videos",
    "section.news": "HyeonjUs Neuigkeiten",
    "section.recentLives": "Letzte Livestreams",
    "section.links": "HyeonjUs Links",
    "action.watchLive": "🔴 Livestream ansehen",
    "action.youtubeChannel": "▶ YouTube-Kanal",
    "action.viewBroadcast": "Livestream ansehen →",
    "action.viewChannel": "Kanal ansehen →",
    "action.viewAllVideos": "Alle Videos ansehen →",
    "action.viewAllPosts": "Alle auf YouTube ansehen →",
    "action.notifications": "Benachrichtigungen →",
    "notice.title": "Wir informieren dich, wenn Hyeonju live geht.",
    "notice.description": "Aktiviere Benachrichtigungen auf diesem Gerät.",
    "videos.title": "Videos",
    "videos.description": "Hier findest du HyeonjUs neueste YouTube-Videos.",
    "links.titleYoutube": "YouTube",
    "links.titleToonation": "Toonation",
    "links.titleOpenChat": "Offener Chat",
    "links.titleInstagram": "Instagram",
    "links.titleThreads": "Threads",
    "links.youtube": "Livestreams und Videos ansehen",
    "links.toonation": "Hyeonju unterstützen",
    "links.openChat": "Lass uns gemeinsam chatten",
    "links.instagram": "HyeonjUs Alltag entdecken",
    "links.threads": "Ihre kleinen Geschichten entdecken",
    "empty.videos": "Keine Videos vorhanden.",
    "history.title": "Livestream-Verlauf",
    "history.empty": "Keine aktuellen Livestreams vorhanden.",
    "live.noLive": "Zurzeit kein Livestream",
    "live.waiting": "Wir warten auf den nächsten Livestream.",
    "live.willAppear": "Der Livestream erscheint hier, sobald er beginnt."
  }
};

const I18nContext = createContext(null);

const STORAGE_KEY = "hyeonju-language";

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState("ko");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (MESSAGES[saved]) {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = next => {
    if (!MESSAGES[next]) return;

    setLanguageState(next);

    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  };

  const t = key => MESSAGES[language]?.[key] ?? MESSAGES.ko[key] ?? key;

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
