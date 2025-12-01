"use client";

import { IBM_Plex_Mono } from "next/font/google";
import "./global.css";
import NavigationBlock from "@/components/NavigationBlock/NavigationBlock";

const IBMPlexMono = IBM_Plex_Mono({
  weight: "400",
});
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={IBMPlexMono.className}>
      <body>
        {children}
        <NavigationBlock></NavigationBlock>
      </body>
    </html>
  );
}
