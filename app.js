// Cashtraq site helpers (dark mode, cookies, chatbot)
document.addEventListener("DOMContentLoaded", () => {
  // ----------------------
  // DARK MODE
  // ----------------------
  const darkToggle = document.getElementById("darkModeToggle");
  const THEME_KEY = "cashtraq_theme"; // "dark" | "light"

  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-mode", isDark);

    // Optional: change the icon so user knows what will happen next
    if (darkToggle) darkToggle.textContent = isDark ? "☀️" : "🌓";
  };

  // Apply saved theme on load
  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme === "dark" ? "dark" : "light");

  // Toggle theme on click
  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }

  // ----------------------
  // COOKIE CONSENT
  // ----------------------
  const cookieBanner = document.getElementById("cookieConsent");
  const acceptCookiesBtn = document.getElementById("acceptCookies");
  const COOKIE_KEY = "cashtraq_cookie_accepted"; // "true"

  const hideCookieBanner = () => {
    if (!cookieBanner) return;
    cookieBanner.style.display = "none";
  };

  if (cookieBanner && acceptCookiesBtn) {
    // Hide if previously accepted
    if (localStorage.getItem(COOKIE_KEY) === "true") {
      hideCookieBanner();
    }

    acceptCookiesBtn.addEventListener("click", () => {
      localStorage.setItem(COOKIE_KEY, "true");
      hideCookieBanner();
    });
  }

  // ----------------------
  // CHATBOT
  // ----------------------
  const chatbotToggle = document.getElementById("chatbotToggle");
  const chatbox = document.getElementById("chatbox");
  const chatbotClose = document.getElementById("chatbotClose"); // only if your HTML includes it

  const isChatOpen = () => chatbox && chatbox.classList.contains("open");

  const openChat = () => {
    if (!chatbox) return;
    chatbox.classList.add("open");
    // If your HTML uses hidden attribute, support it too
    if (typeof chatbox.hidden !== "undefined") chatbox.hidden = false;
  };

  const closeChat = () => {
    if (!chatbox) return;
    chatbox.classList.remove("open");
    if (typeof chatbox.hidden !== "undefined") chatbox.hidden = true;
  };

  if (chatbotToggle && chatbox) {
    chatbotToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isChatOpen()) closeChat();
      else openChat();
    });

    // Close button (optional)
    if (chatbotClose) {
      chatbotClose.addEventListener("click", (e) => {
        e.stopPropagation();
        closeChat();
      });
    }

    // Clicking inside chat should not close it
    chatbox.addEventListener("click", (e) => e.stopPropagation());

    // Click outside to close
    document.addEventListener("click", () => {
      if (isChatOpen()) closeChat();
    });

    // Esc to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isChatOpen()) closeChat();
    });
  }

  // ----------------------
  // Optional: entrance animations hook (only affects .animate elements)
  // ----------------------
  document.body.classList.add("enter");
});
