"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import {
  Column,
  Fade,
  Flex,
  IconButton,
  Line,
  Row,
  SmartLink,
  Text,
  ToggleButton,
} from "@once-ui-system/core";

import { ThinkingOrb } from "thinking-orbs";

import { routes, display, person, about, blog, work } from "@/resources";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Header.module.scss";

type TimeDisplayProps = {
  timeZone: string;
  locale?: string;
};

const TimeDisplay: React.FC<TimeDisplayProps> = ({ timeZone, locale = "en-GB" }) => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      const timeString = new Intl.DateTimeFormat(locale, options).format(now);
      setCurrentTime(timeString);
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [timeZone, locale]);

  return <>{currentTime}</>;
};

export default TimeDisplay;

export const Header = () => {
  const pathname = usePathname() ?? "";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  if (["/login", "/signup"].includes(pathname) || pathname.startsWith("/dashboard")) return null;

  return (
    <>
      {/* Desktop fade overlays */}
      <Fade className={styles.desktopOnly} fillWidth position="fixed" height="80" zIndex={9} />

      {/* Mobile bottom fade */}
      <Fade
        className={styles.mobileOnly}
        fillWidth
        position="fixed"
        bottom="0"
        to="top"
        height="80"
        zIndex={9}
      />

      {/* Desktop header */}
      <Row
        fitHeight
        className={`${styles.position} ${styles.desktopOnly}`}
        position="sticky"
        as="header"
        zIndex={9}
        fillWidth
        padding="8"
        horizontal="center"
        data-border="rounded"
      >
        <Row paddingLeft="32" fillWidth vertical="center">
          <SmartLink href="/" style={{ textDecoration: "none" }}>
            <Text
              variant="heading-default-s"
              onBackground="neutral-weak"
              style={{ letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 400 }}
            >
              Semperr
            </Text>
          </SmartLink>
        </Row>
        <Row fillWidth horizontal="center">
          <Row
            background="page"
            border="neutral-alpha-weak"
            radius="m-4"
            shadow="l"
            padding="4"
            horizontal="center"
            zIndex={1}
          >
            <Row gap="4" vertical="center" textVariant="body-default-s">
              {routes["/"] && (
                <ToggleButton prefixIcon="home" href="/" selected={pathname === "/"} />
              )}
              <Line background="neutral-alpha-medium" vert maxHeight="24" />
              {routes["/about"] && (
                <ToggleButton
                  href="/about"
                  label={
                    <Row gap="8" vertical="center">
                      <ThinkingOrb state="working" size={20} />
                      {about.label}
                    </Row>
                  }
                  selected={pathname === "/about"}
                />
              )}
              {routes["/work"] && (
                <ToggleButton
                  prefixIcon="grid"
                  href="/work"
                  label={work.label}
                  selected={pathname.startsWith("/work")}
                />
              )}
              {routes["/blog"] && (
                <ToggleButton
                  prefixIcon="book"
                  href="/blog"
                  label={blog.label}
                  selected={pathname.startsWith("/blog")}
                />
              )}
              <ToggleButton
                prefixIcon="calendar"
                href="https://cal.com/maherhasan"
                label="Request a Demo"
              />
              {display.themeSwitcher && (
                <>
                  <Line background="neutral-alpha-medium" vert maxHeight="24" />
                  <ThemeToggle />
                </>
              )}
            </Row>
          </Row>
        </Row>
        <Row fillWidth horizontal="end" vertical="center" paddingRight="32">
          <Row
            background="page"
            border="neutral-alpha-weak"
            radius="m-4"
            shadow="l"
            padding="4"
          >
            <ToggleButton href="/login" label="Login" />
          </Row>
        </Row>
      </Row>

      {/* Mobile bottom bar */}
      <Row
        as="header"
        className={`${styles.mobileBar} ${styles.mobileOnly}`}
        position="fixed"
        bottom="0"
        zIndex={10}
        fillWidth
        padding="8"
        horizontal="center"
      >
        <Row
          fillWidth
          background="page"
          border="neutral-alpha-weak"
          radius="m-4"
          shadow="l"
          padding="4"
          paddingX="16"
          horizontal="between"
          vertical="center"
        >
          <SmartLink href="/" style={{ textDecoration: "none" }}>
            <Text
              variant="heading-default-s"
              onBackground="neutral-weak"
              style={{ letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 400 }}
            >
              Semperr
            </Text>
          </SmartLink>
          <Row gap="8" vertical="center">
            {display.themeSwitcher && <ThemeToggle />}
            <IconButton
              icon={mobileMenuOpen ? "close" : "menu"}
              variant="ghost"
              size="m"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            />
          </Row>
        </Row>
      </Row>

      {/* Mobile fullscreen overlay menu */}
      {mobileMenuOpen && (
        <Column
          className={styles.mobileOverlay}
          position="fixed"
          zIndex={9}
          fillWidth
          background="page"
          horizontal="center"
          paddingX="l"
          paddingTop="64"
          paddingBottom="104"
          gap="8"
          style={{ inset: 0, overflowY: "auto" }}
        >
          <Column fillWidth maxWidth="s" gap="8">
            {routes["/"] && (
              <ToggleButton
                fillWidth
                prefixIcon="home"
                href="/"
                label="Home"
                selected={pathname === "/"}
              />
            )}
            {routes["/about"] && (
              <ToggleButton
                fillWidth
                href="/about"
                label={
                  <Row gap="8" vertical="center">
                    <ThinkingOrb state="working" size={20} />
                    {about.label}
                  </Row>
                }
                selected={pathname === "/about"}
              />
            )}
            {routes["/work"] && (
              <ToggleButton
                fillWidth
                prefixIcon="grid"
                href="/work"
                label={work.label}
                selected={pathname.startsWith("/work")}
              />
            )}
            {routes["/blog"] && (
              <ToggleButton
                fillWidth
                prefixIcon="book"
                href="/blog"
                label={blog.label}
                selected={pathname.startsWith("/blog")}
              />
            )}
            <Line fillWidth background="neutral-alpha-weak" marginY="8" />
            <ToggleButton
              fillWidth
              prefixIcon="calendar"
              href="https://cal.com/maherhasan"
              label="Request a Demo"
            />
            <ToggleButton
              fillWidth
              href="/login"
              label="Login"
            />
          </Column>
        </Column>
      )}
    </>
  );
};
