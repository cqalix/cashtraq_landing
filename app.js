
// Cashtraq website — shared behaviour and Supabase connection.
// This is a browser-safe publishable key, NOT a secret/service-role key.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://qdwptrhxvlinmricgzoc.supabase.co';
const supabaseAnonKey = 'sb_publishable_RtzPUsuXomHqQ5ZAUyW9VQ_deAkaETa';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

document.addEventListener('DOMContentLoaded', async () => {
  // Apply the saved appearance before displaying content.
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }

  const page =
    window.location.pathname.split('/').filter(Boolean).pop() ||
    'index.html';

  const protectedPages = [
    'dashboard.html',
    'profile.html',
    'retailers.html',
  ];

  const authPages = ['login.html', 'signup.html'];

  const reveal = () => {
    document.documentElement.style.visibility = 'visible';
  };

  // Resolve the initial session before redirecting.
  document.documentElement.style.visibility = 'hidden';

  let session = null;

  try {
    const result = await supabase.auth.getSession();
    session = result.data.session;

    if (result.error) {
      console.warn('Session check:', result.error.message);
    }
  } catch (error) {
    console.warn('Session check unavailable:', error);
  }

  if (protectedPages.includes(page) && !session) {
    reveal();
    window.location.replace('./login.html');
    return;
  }

  if (authPages.includes(page) && session) {
    reveal();
    window.location.replace('./dashboard.html');
    return;
  }

  reveal();

  // RETAILER CLICK-THROUGHS

  async function handleRedirect() {
    const pathname = window.location.pathname;

    if (!pathname.includes('/go/')) return;

    const slug = pathname.split('/go/')[1]?.split('/')[0];

    if (!slug) return;

    try {
      const { data: retailer, error } = await supabase
        .from('retailers')
        .select('*')
        .eq('slug', decodeURIComponent(slug))
        .single();

      if (error || !retailer) {
        window.location.replace('./404.html');
        return;
      }

      const destination = retailer.destination_url;

      if (!destination) {
        window.location.replace('./404.html');
        return;
      }

      const parsed = new URL(destination);

      if (!['http:', 'https:'].includes(parsed.protocol)) {
        window.location.replace('./404.html');
        return;
      }

      try {
        await supabase.from('clickouts').insert({
          user_id: session?.user?.id ?? null,
          retailer_id: retailer.id,
          out_url: destination,
          platform: 'web',
        });
      } catch (error) {
        console.warn('Clickout tracking unavailable:', error);
      }

      window.location.assign(parsed.href);
    } catch (error) {
      console.error('Retailer redirect failed:', error);
      window.location.replace('./index.html');
    }
  }

  void handleRedirect();

  // SIGNUP

  const signupForm = document.getElementById('signupForm');

  if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = document.getElementById('email')?.value?.trim();
      const password = document.getElementById('password')?.value;
      const button = signupForm.querySelector(
        'button[type="submit"]',
      );

      if (!email || !password) {
        alert('Please enter your email and password.');
        return;
      }

      if (button) button.disabled = true;

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              'https://cashtraq.co.uk/login.html',
          },
        });

        if (error) throw error;

        if (data.session) {
          window.location.assign('./dashboard.html');
        } else {
          const message =
            'Account request received. If email confirmation ' +
            'is required, check your inbox (and junk folder), ' +
            'then return to sign in.';

          const status =
            document.getElementById('signupStatus') ||
            document.getElementById('signupMessage');

          if (status) {
            status.textContent = message;
            status.hidden = false;
            status.style.display = 'block';
          } else {
            alert(message);
          }
        }
      } catch (error) {
        alert(
          error?.message ||
          'Registration failed. Please try again.',
        );
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  // LOGIN

  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const overlay = document.getElementById('loginOverlay');
      const status = document.getElementById('loginStatus');
      const errorEl = document.getElementById('loginError');

      const email = document.getElementById('email')?.value?.trim();
      const password = document.getElementById('password')?.value;

      const button = loginForm.querySelector(
        'button[type="submit"]',
      );

      if (!email || !password) {
        if (errorEl) {
          errorEl.textContent =
            'Please enter your email and password.';
          errorEl.style.display = 'block';
        } else {
          alert('Please enter your email and password.');
        }
        return;
      }

      if (button) button.disabled = true;
      if (overlay) overlay.hidden = false;

      if (status) {
        status.style.display = 'block';
        status.textContent = 'Signing in…';
      }

      if (errorEl) errorEl.style.display = 'none';

      try {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) throw error;

        if (!data.session) {
          throw new Error(
            'Please confirm your email before signing in.',
          );
        }

        window.location.assign('./dashboard.html');
      } catch (error) {
        if (overlay) overlay.hidden = true;
        if (status) status.style.display = 'none';

        if (errorEl) {
          errorEl.textContent =
            error?.message ||
            'Could not sign in. Please try again.';
          errorEl.style.display = 'block';
        } else {
          alert(
            error?.message ||
            'Could not sign in. Please try again.',
          );
        }

        if (button) button.disabled = false;
      }
    });
  }

  // LOGOUT

  const logoutBtn = document.getElementById('logoutBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        alert('Could not log out. Please try again.');
        return;
      }

      window.location.replace('./login.html');
    });
  }

  // DARK MODE

  const darkToggle =
    document.getElementById('darkModeToggle');

  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');

      localStorage.setItem(
        'theme',
        document.body.classList.contains('dark-mode')
          ? 'dark'
          : 'light',
      );
    });
  }

  // COOKIE BANNER

  const cookieBanner =
    document.getElementById('cookieConsent');

  const acceptCookies =
    document.getElementById('acceptCookies');

  if (
    cookieBanner &&
    localStorage.getItem('cookiesAccepted') === 'true'
  ) {
    cookieBanner.classList.add('is-hidden');
  }

  if (cookieBanner && acceptCookies) {
    acceptCookies.addEventListener('click', () => {
      localStorage.setItem('cookiesAccepted', 'true');
      cookieBanner.classList.add('is-hidden');
    });
  }

  // CHATBOT AND FAQ

  const chatbotToggle =
    document.getElementById('chatbotToggle');

  const chatbox = document.getElementById('chatbox');

  const chatbotClose =
    document.getElementById('chatbotClose');

  const FAQ = [
    {
      q: 'Where is my cashback?',
      a: 'Cashtraq helps you record and organise cashback ' +
        'from other providers. Check the original provider ' +
        'to confirm a payment or balance.',
    },
    {
      q: 'Why hasn’t my cashback tracked?',
      a: 'Cashback tracking is handled by the original ' +
        'provider. Check their account and missing-cashback process.',
    },
    {
      q: 'How long does cashback take to confirm?',
      a: 'It varies by provider, retailer and purchase. ' +
        'Your provider is the best source for current status.',
    },
    {
      q: 'What should I do if cashback is missing?',
      a: 'Keep your purchase confirmation and contact ' +
        'the provider through their missing-cashback process.',
    },
    {
      q: 'Does Cashtraq pay cashback?',
      a: 'No. Cashtraq is a place to organise cashback earned ' +
        'through other services; it does not currently issue ' +
        'cashback payments.',
    },
    {
      q: 'Can Cashtraq connect to cashback apps automatically?',
      a: 'Automatic syncing is not currently available. ' +
        'You can record your cashback manually in the app.',
    },
  ];

  function renderFaq() {
    if (!chatbox) return;

    const body = chatbox.querySelector('.chatbox-body');

    if (!body) return;

    body.replaceChildren();

    for (const item of FAQ) {
      const wrap = document.createElement('div');
      wrap.className = 'faq-item';

      const question = document.createElement('button');
      question.type = 'button';
      question.className = 'faq-question';
      question.textContent = item.q;

      const answer = document.createElement('div');
      answer.className = 'faq-answer';
      answer.textContent = item.a;

      question.addEventListener('click', () => {
        const wasOpen = question.classList.contains('open');

        body.querySelectorAll('.faq-question').forEach(
          (el) => el.classList.remove('open'),
        );

        body.querySelectorAll('.faq-answer').forEach(
          (el) => el.classList.remove('open'),
        );

        if (!wasOpen) {
          question.classList.add('open');
          answer.classList.add('open');
        }
      });

      wrap.append(question, answer);
      body.appendChild(wrap);
    }
  }

  function openChat() {
    if (!chatbox) return;
    chatbox.hidden = false;
    chatbox.classList.add('is-open');
  }

  function closeChat() {
    if (!chatbox) return;
    chatbox.classList.remove('is-open');
    chatbox.hidden = true;
  }

  renderFaq();

  if (chatbotToggle && chatbox) {
    chatbotToggle.addEventListener('click', () => {
      if (chatbox.hidden) {
        openChat();
      } else {
        closeChat();
      }
    });
  }

  if (chatbotClose) {
    chatbotClose.addEventListener('click', closeChat);
  }

  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      chatbox &&
      !chatbox.hidden
    ) {
      closeChat();
    }
  });
});
