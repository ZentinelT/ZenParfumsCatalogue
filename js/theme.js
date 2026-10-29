(function(){
  function applyTheme(theme){
    try {
      document.body.setAttribute("data-theme", theme);
      localStorage.setItem("zp-theme", theme);
    } catch(e) {}

    const icons = document.querySelectorAll(".theme-icon");
    const isDark = theme === "dark";
    const sunIcon = '<path d="M12 3v2m0 14v2m9-9h-2M5 12H3m9-6 1.4-1.4M9.6 14.4 8.2 15.8m6.2-1.4 1.4 1.4M9.6 9.6 8.2 8.2"></path><circle cx="12" cy="12" r="3.5"></circle>';
    const moonIcon = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"></path>';
    icons.forEach(function(icon){
      icon.innerHTML = isDark ? moonIcon : sunIcon;
    });

    const toggles = [document.getElementById("themeToggle"), document.getElementById("mobThemeToggle")];
    toggles.forEach(function(btn){
      if(!btn) return;
      btn.setAttribute("aria-label", isDark ? "Activar modo claro" : "Activar modo oscuro");
      btn.setAttribute("title", isDark ? "Activar modo claro" : "Activar modo oscuro");
    });

    const mobLabel = document.getElementById("mobThemeLabel");
    if(mobLabel){ mobLabel.textContent = isDark ? "Modo claro" : "Modo oscuro"; }
  }

  document.body.setAttribute("data-theme", "light");

  try {
    const savedTheme = localStorage.getItem("zp-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(savedTheme || (prefersDark ? "dark" : "light"));
  } catch(e) {
    applyTheme("light");
  }

  document.getElementById("themeToggle")?.addEventListener("click", function(){
    const nextTheme = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });

  document.getElementById("mobThemeToggle")?.addEventListener("click", function(){
    const nextTheme = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });
})();

var _scrollLocks = 0;
var _lockedScrollY = 0;
function lockScroll() {
  if (_scrollLocks === 0) {
    _lockedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = "fixed";
    document.body.style.top = (-_lockedScrollY) + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
  }
  _scrollLocks++;
}
function unlockScroll() {
  _scrollLocks = Math.max(0, _scrollLocks - 1);
  if (_scrollLocks === 0) {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    window.scrollTo(0, _lockedScrollY);
  }
}
