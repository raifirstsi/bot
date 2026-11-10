import { cn } from "@/lib/cn";
import { readSkin, subscribeSkin } from "@/lib/skins";
import { useSyncExternalStore } from "react";

export function RaiLogo({
  className = "h-6 sm:h-7 w-auto object-contain",
  alt = "RAI²"
}: {
  className?: string;
  alt?: string;
}) {
  const skin = useSyncExternalStore(subscribeSkin, readSkin, readSkin);
  const isDark =
    skin === "midnight" ||
    skin === "foundry" ||
    skin === "graphite" ||
    skin === "dusk" ||
    skin === "halloween" ||
    skin === "diwali" ||
    skin === "aurora";

  return (
    <img
      src={isDark ? "/logo-white.png?v=3" : "/logo-black.png?v=3"}
      alt={alt}
      className={cn("rai-brand-logo select-none", className)}
    />
  );
}
