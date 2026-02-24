// ======================
// SUPABASE CLIENT
// ======================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseAnonKey = "YOUR_PUBLIC_ANON_KEY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ======================
// DOM READY
// ======================
document.addEventListener("DOMContentLoaded", async () => {

  // ======================
  // AUTH HELPERS
  // ======================
  async function getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  async function protectPages() {
    const session = await getSession();
    const path = window.location.pathname;

    const protectedPages = ["/dashboard.html", "/profile.html"];
    const authPages = ["/login.html", "/signup.html"];

    if (protectedPages.includes(path) && !session) {
      window.location.href = "/login.html";
    }

    if (authPages.includes(path) && session) {
      window.location.href = "/dashboard.html";
    }
  }

  await protectPages();

  // ======================
  // CLICKOUT REDIRECT
  // ======================
  async function handleRedirect() {
    const path = window.location.pathname;

    if (path.startsWith("/go/")) {
      const slug = path.split("/go/")[1];
      if (!slug) return;

      try {
        const { data: retailer, error } = await supabase
          .from("retailers")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error || !retailer) {
          window.location.href = "/404.html";
          return;
        }

        const session = await getSession();
        const userId = session?.user?.id ?? null;

        await supabase.from("clickouts").insert({
          user_id: userId,
          retailer_id: retailer.id,
          out_url: retailer.destination_url,
          platform: "web"
        });

        window.location.href = retailer.destination_url;

      } catch (err) {
        console.error("Redirect error:", err);
        window.location.href = "/";
      }
    }
  }

  handleRedirect();

  // ======================
  // SIGNUP
  // ======================
  const signupForm = document.getElementById("signupForm");

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email")?.value?.trim();
      const password = document.getElementById("password")?.value;

      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        alert(error.message);
        return;
      }

      window.location.href = "/dashboard.html";
    });
  }

  // ======================
  // LOGIN
  // ======================
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email")?.value?.trim();
      const password = document.getElementById("password")?.value;

      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        alert(error.message);
        return;
      }

      window.location.href = "/dashboard.html";
    });
  }

  // ======================
  // LOGOUT
  // ======================
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "/login.html";
    });
  }

  // ======================
  // DARK MODE (persist)
  // ======================
  const darkToggle = document.getElementById("darkModeToggle");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }

  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem(
        "theme",
        document.body.classList.contains("dark-mode") ? "dark" : "light"
      );
    });
  }

  // ======================
  // COOKIE CONSENT
  // ======================
  const cookieBanner = document.getElementById("cookieConsent");
  const acceptCookies = document.getElementById("acceptCookies");

  if (cookieBanner) {
    const accepted = localStorage.getItem("cookiesAccepted") === "true";
    if (accepted) cookieBanner.classList.add("is-hidden");
  }

  if (acceptCookies && cookieBanner) {
    acceptCookies.addEventListener("click", () => {
      localStorage.setItem("cookiesAccepted", "true");
      cookieBanner.classList.add("is-hidden");
    });
  }

  // ======================
  // CHATBOT + FAQ
  // ======================
  const chatbotToggle = document.getElementById("chatbotToggle");
  const chatbox = document.getElementById("chatbox");
  const chatbotClose = document.getElementById("chatbotClose");

  const FAQ = [
    {
      q: "Where is my cashback?",
      a: "Cashback can take time to track and confirm. Some retailers take up to 90 days (sometimes longer) to confirm."
    },
    {
      q: "Why hasn’t my cashback tracked?",
      a: "Tracking can fail if cookies are blocked, an ad blocker is running, private browsing was used, or attribution was rejected by the retailer."
    },
    {
      q: "How long does cashback take to confirm?",
      a: "It varies by retailer and purchase type. Some confirm in weeks, others may take a few months."
    },
    {
      q: "What should I do if cashback is missing?",
      a: "Wait 24–48 hours first. If it still doesn’t appear, keep your confirmation and contact support with the retailer name and order date."
    },
    {
      q: "What are the loyalty tiers?",
      a: "Your tier is based on tracked cashback earned. Bronze, Silver, and Gold recognise progress and may unlock features later."
    },
    {
      q: "Why might there be a fee later?",
      a: "If premium automation or advanced tools are introduced, those may be optional paid features. We will always be clear before charging."
    }
  ];

  function renderFaq() {
    if (!chatbox) return;

    const body = chatbox.querySelector(".chatbox-body");
    if (!body) return;

    body.innerHTML = "";

    FAQ.forEach(item => {
      const wrap = document.createElement("div");
      wrap.className = "faq-item";

      const q = document.createElement("button");
      q.type = "button";
      q.className = "faq-question";
      q.textContent = item.q;

      const a = document.createElement("div");
      a.className = "faq-answer";
      a.textContent = item.a;

      q.addEventListener("click", () => {
        const isOpen = q.classList.contains("open");

        body.querySelectorAll(".faq-question").forEach(btn => btn.classList.remove("open"));
        body.querySelectorAll(".faq-answer").forEach(ans => ans.classList.remove("open"));

        if (!isOpen) {
          q.classList.add("open");
          a.classList.add("open");
        }
      });

      wrap.appendChild(q);
      wrap.appendChild(a);
      body.appendChild(wrap);
    });
  }

  function openChat() {
    if (!chatbox) return;
    chatbox.hidden = false;
    chatbox.classList.add("is-open");
  }

  function closeChat() {
    if (!chatbox) return;
    chatbox.classList.remove("is-open");
    chatbox.hidden = true;
  }

  if (chatbox) renderFaq();

  if (chatbotToggle && chatbox) {
    chatbotToggle.addEventListener("click", () => {
      if (chatbox.hidden) openChat();
      else closeChat();
    });
  }

  if (chatbotClose) {
    chatbotClose.addEventListener("click", closeChat);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && chatbox && !chatbox.hidden) {
      closeChat();
    }
  });

});
