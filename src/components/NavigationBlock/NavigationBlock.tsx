"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import styles from "./NavigationBlock.module.css";
import { useRouter } from "next/navigation";

interface Tab {
  id: string;
  label: string;
}

const NavigationTabs = () => {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);

  const tabs: Tab[] = [
    { id: "/", label: "home" },
    { id: "/explore", label: "explore" },
    { id: "/me", label: "me" },
  ];

  // Функция для определения активной вкладки
  const isTabActive = (tabId: string) => {
    if (tabId === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(tabId);
  };

  // Эффект для отслеживания скролла
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 50; // Порог скролла для срабатывания
      const isScrollingDown = currentScrollY > lastScrollY;
      const isNearTop = currentScrollY < 100;

      // Всегда показываем наверху
      if (isNearTop) {
        setIsVisible(true);
        setIsAtTop(true);
      } else {
        setIsAtTop(false);
        
        // Прячем при скролле вниз, показываем при скролле вверх
        if (Math.abs(currentScrollY - lastScrollY) > scrollThreshold) {
          if (isScrollingDown && isVisible) {
            setIsVisible(false);
          } else if (!isScrollingDown && !isVisible) {
            setIsVisible(true);
          }
          setLastScrollY(currentScrollY);
        }
      }
    };

    // Добавляем слушатель с passive для производительности
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY, isVisible]);

  // Эффект для обновления индикатора
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

  // Таймер для обновления индикатора после рендера
  useEffect(() => {
    const timer = setTimeout(() => {
      updateIndicator();
    }, 10);

    return () => clearTimeout(timer);
  }, [pathname]);

  const handleClick = (path: string) => {
    router.push(path);
  };

  // Стили для анимации скрытия/показа
  const containerStyle = {
    transform: isVisible ? 'translate(-50%)' : 'translate(-50%) translateY(100%)',
    opacity: isVisible ? 1 : 0,
    transition: 'transform 0.3s ease, opacity 0.3s ease',
  };

  return (
    <div 
      ref={containerRef}
      className={`${styles.navigationContainer} ${isAtTop ? styles.atTop : ''}`}
      style={containerStyle}
    >
      <nav className={styles.headerNav}>
        <div ref={navRef} className={styles.navContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.navLink} ${
                isTabActive(tab.id) ? styles.navLinkActive : ""
              }`}
              onClick={() => handleClick(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <div ref={indicatorRef} className={styles.navIndicator} />
        </div>
      </nav>
    </div>
  );
};

export default NavigationTabs;