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
  const hoverZoneRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

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
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 50;
      const isScrollingDown = currentScrollY > lastScrollY;
      const isNearTop = currentScrollY < 100;

      // Отмечаем, что пользователь скроллит
      setIsScrolling(true);
      
      // Сбрасываем таймер скролла
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 100);

      // Всегда показываем наверху страницы
      if (isNearTop) {
        setIsVisible(true);
      } else {
        // Если пользователь скроллит вниз и не наводит на зону - скрываем
        if (isScrollingDown && !isHovering) {
          setIsVisible(false);
        }
        // Если скроллит вверх - показываем
        else if (!isScrollingDown) {
          setIsVisible(true);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [lastScrollY, isHovering]);

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

  // Обработчики для зоны наведения
  const handleMouseEnter = () => {
    setIsHovering(true);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    // Если пользователь не скроллит, скрываем навигацию
    if (!isScrolling) {
      setIsVisible(false);
    }
  };

  return (
    <>
      {/* Невидимая зона внизу экрана для показа навигации при наведении */}
      <div
        ref={hoverZoneRef}
        className={styles.hoverZone}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Контейнер навигации */}
      <div 
        ref={containerRef}
        className={`${styles.navigationContainer} ${isVisible ? styles.visible : styles.hidden} ${
          isHovering ? styles.hovering : ''
        }`}
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
    </>
  );
};

export default NavigationTabs;