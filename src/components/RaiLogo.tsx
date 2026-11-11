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

export function RaiLogo({
  className = "h-6 sm:h-7 w-auto object-contain",
  alt = "RAI²",
}: {
  className?: string;
  alt?: string;
}) {
  const skin = useSyncExternalStore(subscribeSkin, readSkin, readSkin);
  const isDark = DARK_SKINS.has(skin);

  return (
    <span className={cn("inline-flex items-center select-none shrink-0", className)}>
      <img
        src="/assets/rai-core-white.png?v=5"
        alt={alt}
        className={cn(
          "rai-logo-dark h-full w-auto object-contain transition-opacity duration-150",
          isDark ? "block" : "hidden"
        )}
      />
      <img
        src="/assets/rai-core-black.png?v=5"
        alt={alt}
        className={cn(
          "rai-logo-light h-full w-auto object-contain transition-opacity duration-150",
          isDark ? "hidden" : "block"
        )}
      />
    </span>
  );
}
