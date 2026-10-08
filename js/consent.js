"use strict";

const CONSENT_KEY = "kairox_consent";
const CONSENT_VERSION = 1;
const CONSENT_VALIDITY_DAYS = 180;

const GA_MEASUREMENT_ID = "G-W0EJ50MX8K";
const CLARITY_PROJECT_ID = "xm8yh6bvt8";

let analyticsLoaded = false;
let analyticsAllowed = false;
let consentReturnFocus = null;
let consentBackground = [];
let previousOverflow = "";

function getStoredConsent() {
  try {
    const rawConsent = localStorage.getItem(CONSENT_KEY);

    if (!rawConsent) {
      return null;
    }

    const consent = JSON.parse(rawConsent);

    if (
      consent.version !== CONSENT_VERSION ||
      typeof consent.analytics !== "boolean" ||
      !consent.savedAt
    ) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }

    const savedAt = new Date(consent.savedAt).getTime();
    const validFor =
      CONSENT_VALIDITY_DAYS * 24 * 60 * 60 * 1000;

    if (!Number.isFinite(savedAt) || Date.now() - savedAt > validFor) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }

    return consent;
  } catch (error) {
    console.error("Nie udało się odczytać zgody:", error);
    return null;
  }
}

function saveConsent(analyticsAllowed) {
  const consent = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: analyticsAllowed,
    savedAt: new Date().toISOString()
  };

  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(consent)); }
  catch (_) { /* Bieżący wybór działa również bez dostępu do pamięci przeglądarki. */ }

  return consent;
}

function loadGoogleAnalytics() {
  if (document.getElementById("kairox-ga4")) {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());

  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });

  window.gtag("config", GA_MEASUREMENT_ID, {
    anonymize_ip: true
  });

  const script = document.createElement("script");

  script.id = "kairox-ga4";
  script.async = true;
  script.src =
    `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      GA_MEASUREMENT_ID
    )}`;

  document.head.appendChild(script);
}

function loadClarity() {
  if (window.clarity || document.getElementById("kairox-clarity")) {
    return;
  }

  window.clarity = function clarity() {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  const script = document.createElement("script");

  script.id = "kairox-clarity";
  script.async = true;
  script.src =
    `https://www.clarity.ms/tag/${encodeURIComponent(
      CLARITY_PROJECT_ID
    )}`;

  const firstScript = document.getElementsByTagName("script")[0];

  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
}

function loadAnalytics() {
  if (analyticsLoaded) {
    return;
  }

  analyticsLoaded = true;

  loadGoogleAnalytics();
  loadClarity();
}

function enableAnalytics() {
  analyticsAllowed = true;
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
  loadAnalytics();
  window.gtag?.("consent", "update", {
    analytics_storage: "granted", ad_storage: "denied",
    ad_user_data: "denied", ad_personalization: "denied"
  });
  window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
}

// Send only predefined categories; never text entered into a form or chat.
window.kairoxTrack = function (event, values = {}) {
  if (!analyticsAllowed || typeof window.gtag !== "function") return;
  if (!["generate_lead", "select_content"].includes(event)) return;
  const safe = {};
  for (const [key, allowed] of Object.entries({
    source: ["website", "chat"],
    service: ["audit", "start", "campaign", "communication", "partnership", "unspecified"],
    content_type: ["contact", "audit", "models", "method", "partnership", "portfolio", "articles"]
  })) {
    if (allowed.includes(values[key])) safe[key] = values[key];
  }
  window.gtag("event", event, safe);
};

document.addEventListener("kairox:lead-sent", event => window.kairoxTrack("generate_lead", event.detail));
document.addEventListener("click", event => {
  const link = event.target.closest?.("a.primary-button, a.secondary-button, a.nav-cta");
  if (!link) return;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return;
  const type = {
    "/formularz-kontaktowy.html": "contact", "/audyt-komunikacji.html": "audit",
    "/modele-wspolpracy.html": "models", "/metoda.html": "method",
    "/partnerstwo.html": "partnership", "/realizacje.html": "portfolio", "/artykuly.html": "articles"
  }[url.pathname];
  if (type) window.kairoxTrack("select_content", { content_type: type });
});

function deleteCookie(name) {
  const hostnameParts = window.location.hostname.split(".");
  const possibleDomains = [
    window.location.hostname,
    `.${window.location.hostname}`
  ];

  if (hostnameParts.length >= 2) {
    const rootDomain = hostnameParts.slice(-2).join(".");
    possibleDomains.push(rootDomain, `.${rootDomain}`);
  }

  const paths = ["/", window.location.pathname || "/"];

  possibleDomains.forEach((domain) => {
    paths.forEach((path) => {
      document.cookie =
        `${name}=; Max-Age=0; path=${path}; domain=${domain}; SameSite=Lax`;
    });
  });

  document.cookie =
    `${name}=; Max-Age=0; path=/; SameSite=Lax`;
}

function removeAnalyticsCookies() {
  const cookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter(Boolean);

  cookieNames.forEach((name) => {
    if (
      name === "_ga" ||
      name.startsWith("_ga_") ||
      name === "_gid" ||
      name === "_gat" ||
      name === "_clck" ||
      name === "_clsk" ||
      name.startsWith("CLID")
    ) {
      deleteCookie(name);
    }
  });
}

function disableAnalytics() {
  analyticsAllowed = false;
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;

  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
  }

  if (typeof window.clarity === "function") {
    try {
      window.clarity("consentv2", {
        ad_Storage: "denied",
        analytics_Storage: "denied"
      });
    } catch (error) {
      console.warn("Nie udało się zaktualizować zgody Clarity:", error);
    }
  }

  removeAnalyticsCookies();
}

function showConsentBanner() {
  const banner = document.getElementById("consentBanner");

  if (!banner) {
    return;
  }

  banner.hidden = false;
  if (!banner.classList.contains("is-visible")) {
    consentReturnFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    consentBackground = [...document.body.children].filter(element => element !== banner)
      .map(element => ({ element, inert: element.inert }));
    consentBackground.forEach(({element}) => { element.inert = true; });
    document.body.style.overflow = "hidden";
  }

  requestAnimationFrame(() => {
    banner.classList.add("is-visible");
    document.getElementById("rejectAnalytics")?.focus();
  });
}

function hideConsentBanner() {
  const banner = document.getElementById("consentBanner");

  if (!banner) {
    return;
  }

  banner.classList.remove("is-visible");
  consentBackground.forEach(({element, inert}) => { element.inert = inert; });
  consentBackground = [];
  document.body.style.overflow = previousOverflow;
  if (consentReturnFocus?.isConnected) consentReturnFocus.focus();

  window.setTimeout(() => {
    banner.hidden = true;
  }, 250);
}

function acceptAnalytics() {
  saveConsent(true);

  enableAnalytics();
  hideConsentBanner();
}

function rejectAnalytics() {
  saveConsent(false);
  disableAnalytics();
  hideConsentBanner();
}

function initializeConsent() {
  const acceptButton = document.getElementById("acceptAnalytics");
  const rejectButton = document.getElementById("rejectAnalytics");
  const privacySettings = document.getElementById("privacySettings");

  acceptButton?.addEventListener("click", acceptAnalytics);
  rejectButton?.addEventListener("click", rejectAnalytics);

  privacySettings?.addEventListener("click", () => {
    showConsentBanner();
  });
  document.getElementById("consentBanner")?.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); rejectAnalytics(); }
    if (event.key !== "Tab") return;
    const first = rejectButton, last = acceptButton;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const storedConsent = getStoredConsent();

  if (!storedConsent) {
    showConsentBanner();
    return;
  }

  if (storedConsent.analytics) {
    enableAnalytics();
  } else {
    disableAnalytics();
  }
}

document.addEventListener("DOMContentLoaded", initializeConsent);
