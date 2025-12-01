"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import styles from "./NavigationBlock.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Tab {
  id: string;
  label: string;
}

const NavigationTabs = () => {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const tabs: Tab[] = [
    { id: "/", label: "home" },
    { id: "/explore", label: "explore" },
    { id: "/me", label: "me" },
  ];

  useEffect(() => {
    updateIndicator();
  }, [pathname]);

  const updateIndicator = () => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;

    if (!nav || !indicator) return;

    const activeElement = nav.querySelector(
      `.${styles.navLinkActive}`
    ) as HTMLElement;

    if (!activeElement) return;

    const { offsetLeft, offsetWidth } = activeElement;

    indicator.style.transform = `translateX(${offsetLeft}px)`;
    indicator.style.width = `${offsetWidth}px`;
    indicator.style.opacity = "1";
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      updateIndicator();
    }, 10);

    return () => clearTimeout(timer);
  }, []);
  const hendleClick = (path) => {
    router.push(path);
  };
  return (
    <nav className={styles.headerNav}>
      <div ref={navRef} className={styles.navContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.navLink} ${
              pathname === tab.id ? styles.navLinkActive : ""
            }`}
            onClick={() => hendleClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <div ref={indicatorRef} className={styles.navIndicator} />
      </div>
    </nav>
  );
};

export default NavigationTabs;
