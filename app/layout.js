export const metadata = {
  title: "현주님 HUB",
  description: "현주님의 YouTube 콘텐츠를 한 곳에서",
};
export default function RootLayout({children}) {
  return <html lang="ko"><body>{children}</body></html>;
}