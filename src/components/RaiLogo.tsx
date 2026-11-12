import { cn } from "@/lib/cn";
import { readSkin, subscribeSkin } from "@/lib/skins";
import { useSyncExternalStore } from "react";

const DARK_SKINS = new Set([
  "midnight",
  "foundry",
  "graphite",
  "dusk",
  "halloween",
  "diwali",
  "aurora",
]);

const LIGHT_SKINS = new Set([
  "daylight",
  "linen",
  "meadow",
  "chalk",
  "porcelain",
  "sage",
  "sand",
  "paper",
  "atelier",
  "lagoon",
  "pop",
]);

export function RaiLogo({
  className = "h-6 sm:h-7 w-auto object-contain",
  alt = "RAI²",
}: {
  className?: string;
  alt?: string;
}) {
  const skin = useSyncExternalStore(subscribeSkin, readSkin, readSkin);
  const isDark = LIGHT_SKINS.has(skin)
    ? false
    : DARK_SKINS.has(skin) ||
      (typeof document !== "undefined" &&
        !LIGHT_SKINS.has(document.documentElement.getAttribute("data-skin") || "") &&
        (document.documentElement.classList.contains("dark") ||
          document.documentElement.getAttribute("data-theme") === "dark"));

  return (
    <span className={cn("inline-flex items-center select-none shrink-0", className)}>
      <img
        src="/assets/rai-core-white.png?v=6"
        alt={alt}
        className={cn(
          "rai-logo-dark h-full w-auto object-contain transition-opacity duration-150",
          isDark ? "block" : "hidden"
        )}
      />
      <img
        src="/assets/rai-core-black.png?v=6"
        alt={alt}
        className={cn(
          "rai-logo-light h-full w-auto object-contain transition-opacity duration-150",
          isDark ? "hidden" : "block"
        )}
      />
    </span>
  );
}
