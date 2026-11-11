export const MASCOT_LIBRARY = [
  { id: "mascot-1", url: "/assets/mascots/mascot-1.png", name: "Capybara Laptop" },
  { id: "mascot-2", url: "/assets/mascots/mascot-2.png", name: "Capybara RAI² Laptop" },
  { id: "mascot-3", url: "/assets/mascots/mascot-3.png", name: "Capybara Tai Nghe" },
  { id: "mascot-4", url: "/assets/mascots/mascot-4.png", name: "Capybara Hồng Tai Nghe" },
  { id: "mascot-5", url: "/assets/mascots/mascot-5.png", name: "Capybara Studio" },
  { id: "mascot-6", url: "/assets/mascots/mascot-6.png", name: "Chuột Lang Headphone" },
  { id: "mascot-7", url: "/assets/mascots/mascot-7.png", name: "Gấu Bông Capybara" },
  { id: "mascot-8", url: "/assets/mascots/mascot-8.png", name: "Capybara Tablet" },
] as const;

export const READY_BOT_MASCOT_MAP: Record<string, string> = {
  assistant: "/assets/mascots/mascot-1.png",
  inbox: "/assets/mascots/mascot-2.png",
  research: "/assets/mascots/mascot-3.png", // Scout
  coder: "/assets/mascots/mascot-4.png",    // Dev
  community: "/assets/mascots/mascot-5.png",// Watch
  social: "/assets/mascots/mascot-6.png",   // Buzz
  ops: "/assets/mascots/mascot-7.png",      // Ops
  writer: "/assets/mascots/mascot-8.png",   // Quill
  analyst: "/assets/mascots/mascot-1.png",  // Sigma
  "meeting-notes": "/assets/mascots/mascot-2.png",
  travel: "/assets/mascots/mascot-3.png",
  study: "/assets/mascots/mascot-4.png",
  humanizer: "/assets/mascots/mascot-5.png",
  "design-critic": "/assets/mascots/mascot-6.png",
  "call-coach": "/assets/mascots/mascot-7.png",
  "plant-care": "/assets/mascots/mascot-8.png",
};

/**
 * Returns a cute mascot image URL for any bot or agent.
 */
export function getBotMascotUrl(bot: { id?: string; name?: string; color?: string; mascotBody?: string | null }): string {
  const nameLower = (bot.name || "").toLowerCase().trim();
  const idLower = (bot.id || "").toLowerCase().trim();

  // Special specific agents
  if (nameLower.includes("muse") || idLower.includes("muse")) {
    return "/assets/muse-avatar.png";
  }
  if (nameLower.includes("rai") || idLower.includes("rai")) {
    return "/assets/bot-mascot-circle.png";
  }
  if (nameLower.includes("biscuit") || idLower.includes("biscuit")) {
    return "/assets/mascots/mascot-1.png";
  }

  // Ready template bots check
  for (const [key, url] of Object.entries(READY_BOT_MASCOT_MAP)) {
    if (idLower === key || nameLower === key || nameLower.includes(key)) {
      return url;
    }
  }

  // Ready bot name checks:
  if (nameLower.includes("assistant")) return "/assets/mascots/mascot-1.png";
  if (nameLower.includes("inbox")) return "/assets/mascots/mascot-2.png";
  if (nameLower.includes("scout")) return "/assets/mascots/mascot-3.png";
  if (nameLower.includes("dev")) return "/assets/mascots/mascot-4.png";
  if (nameLower.includes("watch")) return "/assets/mascots/mascot-5.png";
  if (nameLower.includes("buzz")) return "/assets/mascots/mascot-6.png";
  if (nameLower.includes("ops")) return "/assets/mascots/mascot-7.png";
  if (nameLower.includes("quill")) return "/assets/mascots/mascot-8.png";
  if (nameLower.includes("sigma")) return "/assets/mascots/mascot-1.png";

  // Deterministic fallback based on hash of id or name or color
  const keyStr = bot.id || bot.name || bot.color || "mascot";
  let hash = 0;
  for (let i = 0; i < keyStr.length; i++) {
    hash = (hash << 5) - hash + keyStr.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % MASCOT_LIBRARY.length;
  return MASCOT_LIBRARY[idx].url;
}
