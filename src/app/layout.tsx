import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mariam Fathi | Software Engineer",
  description:
    "Portfolio of Mariam Fathi, a software engineer building production web and mobile systems, with a growing focus on data and AI.",
  keywords: [
    "Mariam Fathi",
    "Software Engineer",
    "Data Science",
    "Data Engineering",
    "Machine Learning",
    "React",
    "React Native",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root app layout, applies to every page */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Momo+Trust+Display&display=swap"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
