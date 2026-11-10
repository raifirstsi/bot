import { cn } from "@/lib/cn";

export function RaiLogo({
  className = "h-8 w-auto object-contain",
  alt = "RAI² SI"
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <picture className="inline-flex items-center justify-center">
      <source srcSet="/logo-black.png" media="(prefers-color-scheme: light)" />
      <img
        src="/logo-white.png"
        alt={alt}
        className={cn("rai-brand-logo", className)}
      />
    </picture>
  );
}
