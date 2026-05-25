(function () {
  try {
    var root = document.documentElement;

    function readCookie(name) {
      var match = document.cookie.split("; ").find(function (c) {
        return c.startsWith(name + "=");
      });
      return match ? decodeURIComponent(match.split("=")[1]) : null;
    }

    function readLocal(name) {
      try {
        return window.localStorage.getItem(name);
      } catch (e) {
        return null;
      }
    }

    function readPreference(key, fallback) {
      // Hardcoded defaults for the standalone script
      var defaults = {
        theme_mode: "light",
        theme_preset: "default",
        font: "inter",
        content_layout: "wide",
        navbar_style: "sticky",
        sidebar_variant: "inset",
        sidebar_collapsible: "icon",
      };

      var value = readLocal(key) || readCookie(key) || defaults[key];
      return value;
    }

    var mode = readPreference("theme_mode", "light");
    var resolvedMode =
      mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;

    root.classList.toggle("dark", resolvedMode === "dark");
    root.setAttribute("data-theme-mode", mode);
    root.setAttribute("data-theme-preset", readPreference("theme_preset", "default"));
    root.setAttribute("data-font", readPreference("font", "inter"));
    root.setAttribute("data-content-layout", readPreference("content_layout", "wide"));
    root.setAttribute("data-navbar-style", readPreference("navbar_style", "sticky"));
    root.setAttribute("data-sidebar-variant", readPreference("sidebar_variant", "inset"));
    root.setAttribute("data-sidebar-collapsible", readPreference("sidebar_collapsible", "icon"));
    root.style.colorScheme = resolvedMode === "dark" ? "dark" : "light";
  } catch (e) {
    console.warn("Theme boot error:", e);
  }
})();
