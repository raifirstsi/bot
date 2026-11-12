const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const sharedTheme = /(?:^|;\s*)rai2_theme=(light|dark)(?:;|$)/.exec(document.cookie)?.[1];
const saved = localStorage.getItem("rai2_landing_theme");
const initialTheme = sharedTheme || saved || "light";
root.dataset.theme = initialTheme;

const syncTheme = () => {
  const light = root.dataset.theme === "light";
  if (toggle) {
    const label = light ? "Bật giao diện tối" : "Bật giao diện sáng";
    toggle.setAttribute("aria-label", label);
    toggle.title = label;
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.content = light ? "#f8fafd" : "#080808";
  }
  if (location.hostname === "rai2.si" || location.hostname.endsWith(".rai2.si")) {
    document.cookie = `rai2_theme=${root.dataset.theme}; Domain=rai2.si; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
  }
};

if (toggle) {
  toggle.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("rai2_landing_theme", root.dataset.theme);
    syncTheme();
  });
}
syncTheme();

const menuButton = document.querySelector(".mobile-menu-toggle");
const menu = document.querySelector(".mobile-dialog");
const menuClose = menu?.querySelector(".mobile-dialog-close");
let closingTimer;

const closeMenu = (immediate = false) => {
  if (!menu?.open) return;
  if (closingTimer) clearTimeout(closingTimer);
  const finish = () => {
    menu.close();
    menu.classList.remove("closing");
    document.body.classList.remove("menu-open");
    menuButton?.setAttribute("aria-expanded", "false");
    closingTimer = undefined;
  };
  if (immediate || matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
  else {
    menu.classList.add("closing");
    closingTimer = setTimeout(finish, 150);
  }
};

menuButton?.addEventListener("click", () => {
  if (menu?.open) return;
  menu?.showModal();
  document.body.classList.add("menu-open");
  menuButton.setAttribute("aria-expanded", "true");
});
menuClose?.addEventListener("click", () => closeMenu());
menu?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeMenu();
});
menu?.addEventListener("click", (event) => {
  const bounds = menu.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu();
});
menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu(true)));
addEventListener("resize", () => {
  if (innerWidth > 960) closeMenu(true);
});
