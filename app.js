// Wait for page to load
document.addEventListener("DOMContentLoaded", function () {

  // ======================
  // DARK MODE
  // ======================

  const toggle = document.getElementById("darkModeToggle");

  if (toggle) {
    toggle.addEventListener("click", function () {
      document.body.classList.toggle("dark-mode");

      if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
      } else {
        localStorage.setItem("theme", "light");
      }
    });
  }

  // Load saved theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }


  // ======================
  // COOKIE CONSENT
  // ======================

  const cookieBanner = document.getElementById("cookieConsent");
  const acceptBtn = document.getElementById("acceptCookies");

  if (cookieBanner && acceptBtn) {

    if (localStorage.getItem("cookiesAccepted") === "true") {
      cookieBanner.style.display = "none";
    }

    acceptBtn.addEventListener("click", function () {
      localStorage.setItem("cookiesAccepted", "true");
      cookieBanner.style.display = "none";
    });
  }


  // ======================
  // CHATBOT TOGGLE
  // ======================

  const chatbotToggle = document.getElementById("chatbotToggle");
  const chatbox = document.getElementById("chatbox");

  if (chatbotToggle && chatbox) {
    chatbotToggle.addEventListener("click", function () {
      chatbox.classList.toggle("open");
    });
  }

});
