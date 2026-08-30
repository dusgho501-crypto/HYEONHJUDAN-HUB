export const metadata = {
  title: "현주님의 작은 우주",
  description: "현주님의 YouTube 콘텐츠를 한곳에서 만나보세요.",
  applicationName: "현주님의 작은 우주",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "현주님의 작은 우주",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
