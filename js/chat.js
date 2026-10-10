(() => {
  "use strict";
  if (document.getElementById("kairox-chat")) return;
  const scriptUrl = document.currentScript.src;
  const config = window.KAIROX_CHAT_CONFIG || {};
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = new URL("../css/chat.css?v=keyboard-2", document.currentScript.src).href;
  document.head.appendChild(stylesheet);
  const root = document.createElement("aside");
  root.id = "kairox-chat";
  root.className = "kx-chat";
  root.setAttribute("data-clarity-mask", "true");
  root.innerHTML = `
    <button class="kx-chat-launcher" type="button" aria-expanded="false" aria-controls="kx-chat-panel">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 3V11.5a9 9 0 0 1 18 0Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
      Zapytaj AI
    </button>
    <div id="kx-chat-panel" class="kx-chat-panel" role="dialog" aria-labelledby="kx-chat-title" hidden>
      <header class="kx-chat-header">
        <div><span class="kx-chat-eyebrow">KAIROX · BIELIK</span><h2 id="kx-chat-title">Porozmawiajmy o Twojej stronie</h2></div>
        <div class="kx-chat-header-actions"><button class="kx-chat-reset" type="button" hidden>Nowa rozmowa</button><button class="kx-chat-close" type="button" aria-label="Zamknij czat">×</button></div>
      </header>
      <div class="kx-chat-intro">
        <p>Nie wiesz, od czego zacząć? Pomogę Ci poznać ofertę i wybrać kierunek.</p>
        <p class="kx-chat-disclosure">To asystent AI w wersji testowej — może się mylić. Wiadomości i krótka historia rozmowy są przesyłane przez Cloudflare do Hugging Face i Public AI. Nie wpisuj danych osobowych ani poufnych informacji.</p>
        <p class="kx-chat-disclosure">Historia w tej karcie znika po odświeżeniu. Dostawcy przetwarzają wiadomości według swoich zasad. <a href="https://publicai.co/tc" target="_blank" rel="noopener noreferrer">Zasady Public AI ↗</a></p>
        <button class="kx-chat-start" type="button">Rozpocznij rozmowę</button>
        <p class="kx-chat-direct"><a href="/formularz-kontaktowy.html">Wolisz porozmawiać z zespołem?</a></p>
      </div>
      <div class="kx-chat-conversation" hidden>
        <div class="kx-chat-content" role="region" aria-label="Rozmowa z asystentem" tabindex="0">
        <div class="kx-chat-thread"></div>
        <div class="kx-chat-suggestions">
          <button type="button">Od czego zacząć?</button>
          <button type="button">Jakie macie realizacje?</button>
          <button type="button">Jaki artykuł warto przeczytać?</button>
        </div>
        <form class="kx-chat-lead" hidden novalidate>
          <p class="kx-chat-lead-title">Zostaw kontakt</p>
          <p class="kx-chat-lead-service"></p>
          <label for="kx-lead-name">Imię (opcjonalnie)</label>
          <input id="kx-lead-name" autocomplete="given-name" maxlength="120">
          <label for="kx-lead-email">Adres e-mail</label>
          <input id="kx-lead-email" type="email" autocomplete="email" maxlength="254">
          <label for="kx-lead-phone">Numer telefonu</label>
          <input id="kx-lead-phone" type="tel" autocomplete="tel" maxlength="30">
          <p class="kx-chat-disclosure">Wystarczy e-mail lub telefon. Dane wyślemy do KAIROX przez formularz — nie do modelu AI.</p>
          <label class="kx-chat-lead-consent"><input id="kx-lead-privacy" type="checkbox"> <span>Zapoznałem(-am) się z <a href="/polityka-prywatnosci.html" target="_blank" rel="noopener noreferrer">Polityką prywatności</a> i przyjmuję do wiadomości zasady przetwarzania danych.</span></label>
          <p class="kx-chat-lead-status" role="status" aria-live="polite"></p>
          <div class="kx-chat-actions"><button class="kx-chat-lead-cancel" type="button">Wróć do rozmowy</button><button class="kx-chat-lead-send" type="submit" disabled>Wyślij zgłoszenie</button></div>
        </form>
        </div>
        <form class="kx-chat-form">
          <label for="kx-chat-message">Twoje pytanie</label>
          <textarea id="kx-chat-message" rows="2" maxlength="2000" placeholder="Np. mam stronę, ale nie dostaję zapytań…" required data-private="true"></textarea>
          <button class="kx-chat-send" type="submit" disabled>Wyślij wiadomość ↗</button>
          <div class="kx-chat-verification"></div>
          <p class="kx-chat-status" role="status" aria-live="polite"></p>
        </form>
        <p class="kx-chat-footnote">AI może się mylić. Bez danych osobowych. <a href="/formularz-kontaktowy.html">Kontakt z zespołem</a></p>
      </div>
    </div>`;
  document.body.appendChild(root);
  const $ = (selector) => root.querySelector(selector);
  const launcher = $(".kx-chat-launcher");
  const panel = $(".kx-chat-panel");
  const start = $(".kx-chat-start");
  const form = $(".kx-chat-form");
  const input = $("textarea");
  const send = $(".kx-chat-send");
  const status = $(".kx-chat-status");
  const thread = $(".kx-chat-thread");
  const content = $(".kx-chat-content");
  const verification = $(".kx-chat-verification");
  const leadForm = $(".kx-chat-lead");
  const leadStatus = $(".kx-chat-lead-status");
  const leadSend = $(".kx-chat-lead-send");
  let getSuggestions, renderMessage, inferService, sendContact, validateContact, activeService, pendingOffer, leadBusy = false, leadSent = false;
  const interests = new Map(), offeredServices = new Set();
  let chatSession = "", sessionExpiresAt = 0, sessionTimer;
  let history = [], token = "", widgetId, loading = false, scriptPromise, controller, generation = 0;
  let queuedSuggestion = "";
  // Mobile keyboards resize the visual viewport, often leaving 100dvh unchanged.
  let viewportFrame, focusTimer, editing = false, focusSettled = false;
  let unfocusedHeight = window.visualViewport?.height ?? window.innerHeight;
  function syncChatViewport() {
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop ?? 0;
    let bottom = Math.min(top + (viewport?.height ?? window.innerHeight), window.innerHeight);
    const keyboard = navigator.virtualKeyboard?.boundingRect;
    if (keyboard?.height > 0 && keyboard.width > 0 && keyboard.top > top) bottom = Math.min(bottom, keyboard.top);
    const height = Math.max(0, bottom - top);
    const focused = editing && root.contains(document.activeElement);
    if (!editing) unfocusedHeight = height;
    // Some in-app browsers overlay the keyboard without reporting any resize.
    // Keep the composer near the top instead of guessing the keyboard's height.
    root.classList.toggle("kx-chat-composer-top", focused && focusSettled && unfocusedHeight - height < 120);
    root.style.setProperty("--kx-visible-height", `${height}px`);
    root.style.setProperty("--kx-visible-top", `${top}px`);
  }
  function scheduleChatViewport() {
    cancelAnimationFrame(viewportFrame);
    viewportFrame = requestAnimationFrame(syncChatViewport);
  }
  window.visualViewport?.addEventListener("resize", scheduleChatViewport);
  window.visualViewport?.addEventListener("scroll", scheduleChatViewport);
  window.addEventListener("resize", scheduleChatViewport);
  navigator.virtualKeyboard?.addEventListener("geometrychange", scheduleChatViewport);
  root.addEventListener("focusin", (event) => {
    if (!event.target.matches("textarea,input:not([type=checkbox])") || editing) return;
    editing = true; focusSettled = false;
    clearTimeout(focusTimer);
    focusTimer = setTimeout(() => { focusSettled = true; scheduleChatViewport(); }, 500);
    scheduleChatViewport();
  });
  root.addEventListener("focusout", () => {
    // Delay until focus has reached the next control, including another lead field.
    setTimeout(() => {
      if (root.contains(document.activeElement) && document.activeElement.matches("textarea,input:not([type=checkbox])")) return;
      if (form.contains(document.activeElement)) return;
      editing = false; focusSettled = false; clearTimeout(focusTimer); scheduleChatViewport();
    }, 0);
  });
  syncChatViewport();
  function hasSession() { return Boolean(chatSession && Date.now() < sessionExpiresAt); }
  function updateSend() { send.disabled = loading || (!token && !hasSession()) || !input.value.trim(); }
  function openChat() {
    syncChatViewport();
    panel.hidden = false;
    launcher.hidden = true;
    launcher.setAttribute("aria-expanded", "true");
    (!leadForm.hidden ? $("#kx-lead-email") : $(".kx-chat-intro").hidden ? input : start).focus();
  }
  function closeChat() { queuedSuggestion = ""; panel.hidden = true; launcher.hidden = false; launcher.setAttribute("aria-expanded", "false"); launcher.focus(); }
  launcher.addEventListener("click", () => panel.hidden ? openChat() : closeChat());
  $(".kx-chat-close").addEventListener("click", closeChat);
  root.addEventListener("keydown", (event) => { if (event.key === "Escape" && !panel.hidden) { event.preventDefault(); closeChat(); } });
  function addMessage(role, text) {
    const message = document.createElement("p");
    message.className = `kx-chat-message kx-chat-message--${role}`;
    const name = document.createElement("span");
    name.className = "kx-chat-speaker";
    name.textContent = role === "user" ? "Ty" : "Bielik · AI";
    const messageText = document.createElement("span");
    if (role === "assistant" && renderMessage) renderMessage(messageText, text);
    else messageText.textContent = text;
    message.append(name, messageText);
    thread.appendChild(message);
    content.scrollTop = content.scrollHeight;
  }
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timer = setTimeout(() => reject(new Error("Weryfikacja nie została załadowana. Spróbuj ponownie.")), 15000);
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => { clearTimeout(timer); window.turnstile ? resolve() : reject(new Error("Weryfikacja jest niedostępna.")); };
      script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error("Nie udało się załadować weryfikacji. Sprawdź połączenie lub blokadę skryptów.")); };
      document.head.appendChild(script);
    }).catch((error) => { scriptPromise = undefined; throw error; });
    return scriptPromise;
  }
  start.addEventListener("click", async () => {
    if (!config.turnstileSiteKey || !config.endpoint) {
      start.textContent = "Czat czeka na uruchomienie";
      return;
    }
    start.disabled = true;
    start.textContent = "Przygotowuję rozmowę…";
    try {
      const [, interestModule, contactModule, formatModule, suggestionsModule] = await Promise.all([
        loadTurnstile(), import(new URL("./chat-interest.mjs", scriptUrl).href),
        import(new URL("./contact-service.mjs?v=audit-2", scriptUrl).href),
        import(new URL("./chat-format.mjs", scriptUrl).href),
        import(new URL("./chat-suggestions.mjs", scriptUrl).href),
      ]);
      getSuggestions = suggestionsModule.getSuggestions;
      renderMessage = formatModule.renderMessage;
      inferService = interestModule.inferService;
      ({ sendContact, validateContact } = contactModule);
      $(".kx-chat-intro").hidden = true;
      $(".kx-chat-conversation").hidden = false;
      $(".kx-chat-reset").hidden = false;
      addMessage("assistant", "Cześć! Pomogę Ci poznać ofertę KAIROX. Co chcesz poprawić na swojej stronie?");
      status.textContent = "Trwa weryfikacja bezpieczeństwa…";
      verification.hidden = false;
      widgetId = window.turnstile.render(verification, {
        sitekey: config.turnstileSiteKey, action: "kairox_chat", theme: "dark", size: "flexible", appearance: "interaction-only",
        callback: (value) => {
          token = value;
          verification.hidden = true;
          if (!loading && /^(Trwa weryfikacja|Weryfikacja wygasła)/.test(status.textContent)) status.textContent = "";
          updateSend();
          if (queuedSuggestion && input.value === queuedSuggestion && !panel.hidden && !send.disabled) {
            queuedSuggestion = ""; form.requestSubmit();
          }
        },
        "expired-callback": () => { token = ""; updateSend(); if (!hasSession()) resetVerification(); },
        "error-callback": () => {
          token = ""; updateSend();
          if (!hasSession()) {
            verification.hidden = false;
            status.textContent = "Weryfikacja się nie powiodła. Odśwież stronę lub użyj formularza kontaktowego.";
          }
        },
      });
      input.focus();
    } catch (error) {
      $(".kx-chat-intro").hidden = false;
      $(".kx-chat-conversation").hidden = true;
      thread.replaceChildren();
      start.textContent = error.message + " Kliknij, aby ponowić.";
      start.disabled = false;
    }
  });
  input.addEventListener("input", () => { queuedSuggestion = ""; updateSend(); });
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
    if (panel.hidden || form.hidden || !input.value.trim()) return;
    event.preventDefault();
    if (!send.disabled) form.requestSubmit();
  });
  function updateSuggestions(message = "") {
    const buttons = getSuggestions(message, history).map(question => {
      const button = document.createElement("button");
      button.type = "button"; button.textContent = question;
      return button;
    });
    $(".kx-chat-suggestions").replaceChildren(...buttons);
  }
  $(".kx-chat-suggestions").addEventListener("click", (event) => {
    const suggestion = event.target.closest("button");
    if (!suggestion || loading || panel.hidden || form.hidden) return;
    input.value = suggestion.textContent; input.focus(); updateSend();
    if (!send.disabled) { queuedSuggestion = ""; form.requestSubmit(); }
    else { queuedSuggestion = input.value; status.textContent = "Trwa weryfikacja bezpieczeństwa…"; }
  });
  function resetVerification() {
    token = ""; updateSend();
    verification.hidden = false;
    if (widgetId !== undefined) window.turnstile.reset(widgetId);
  }
  $(".kx-chat-reset").addEventListener("click", () => {
    generation++; controller?.abort(); loading = false; history = []; input.value = ""; queuedSuggestion = "";
    interests.clear(); offeredServices.clear(); activeService = undefined; pendingOffer = undefined; leadSent = false;
    leadForm.reset(); leadStatus.textContent = ""; setCollecting(false);
    thread.replaceChildren(); addMessage("assistant", "Zaczynamy od nowa. W czym mogę pomóc?");
    updateSuggestions();
    status.textContent = ""; if (!hasSession()) resetVerification(); else updateSend(); input.focus();
  });
  function setCollecting(value) {
    root.classList.toggle("kx-chat-is-collecting", value);
    content.scrollTop = value ? 0 : content.scrollHeight;
    leadForm.hidden = !value;
    form.hidden = value;
    $(".kx-chat-suggestions").hidden = value;
    $(".kx-chat-reset").disabled = leadBusy;
  }
  function offerContact(message) {
    const service = inferService(message, history);
    if (!service || leadSent) return;
    const count = (interests.get(service.id) || 0) + 1;
    interests.set(service.id, count);
    if (count < 2 || offeredServices.has(service.id)) return;
    offeredServices.add(service.id);
    const offer = document.createElement("div");
    offer.className = "kx-chat-message kx-chat-message--assistant kx-chat-contact-offer";
    const question = document.createElement("p");
    question.textContent = `Rozmawiamy o usłudze „${service.label}”. Czy chcesz zostawić kontakt, żebyśmy omówili Twój projekt?`;
    const accept = document.createElement("button");
    accept.type = "button"; accept.textContent = "Tak, zostawiam kontakt";
    const decline = document.createElement("button");
    decline.type = "button"; decline.textContent = "Nie teraz";
    const options = document.createElement("div"); options.className = "kx-chat-offer-actions";
    options.append(accept, decline); offer.append(question, options); thread.appendChild(offer);
    content.scrollTop = content.scrollHeight;
    pendingOffer = { accept, decline };
    accept.addEventListener("click", () => {
      if (leadBusy || leadSent) return;
      pendingOffer = undefined;
      activeService = service;
      leadStatus.textContent = "";
      $(".kx-chat-lead-service").textContent = `Interesuje Cię: ${service.label}`;
      setCollecting(true); $("#kx-lead-email").focus();
    });
    decline.addEventListener("click", () => {
      if (leadBusy) return;
      pendingOffer = undefined;
      options.remove(); question.textContent = "Jasne, możemy dalej porozmawiać o ofercie.";
      input.focus();
    });
  }
  function contactFields() {
    return {
      name: $("#kx-lead-name").value.trim(), email: $("#kx-lead-email").value.trim(),
      phone: $("#kx-lead-phone").value.trim(), consent: $("#kx-lead-privacy").checked,
    };
  }
  function updateLead() {
    const fields = contactFields();
    leadSend.disabled = leadBusy || !(fields.email || fields.phone) || !fields.consent;
  }
  leadForm.addEventListener("input", updateLead);
  leadForm.addEventListener("change", updateLead);
  $(".kx-chat-lead-cancel").addEventListener("click", () => {
    if (leadBusy) return;
    leadForm.reset(); leadStatus.textContent = ""; updateLead(); setCollecting(false); input.focus();
  });
  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (leadBusy || !activeService) return;
    const fields = contactFields();
    const valid = validateContact(fields);
    if (!valid.valid) { leadStatus.textContent = "Podaj poprawny e-mail lub telefon i zaakceptuj informację o przetwarzaniu danych."; return; }
    leadBusy = true; updateLead(); $(".kx-chat-lead-cancel").disabled = true;
    leadStatus.textContent = "Wysyłanie zgłoszenia…";
    try {
      await sendContact({ ...fields, website: "", contactMethod: fields.email ? "E-mail" : "Telefon",
        source: "chat", service: activeService.label, sourcePage: window.location.pathname,
        challenge: `Kontakt z czatu KAIROX. Zainteresowanie usługą: ${activeService.label}.`,
      });
      leadSent = true; leadForm.reset(); setCollecting(false);
      addMessage("assistant", "Dziękujemy! Twoje zgłoszenie zostało wysłane do KAIROX. Możemy dalej porozmawiać o ofercie.");
      thread.querySelectorAll(".kx-chat-contact-offer").forEach(offer => offer.remove());
      input.focus();
    } catch {
      leadStatus.textContent = "Nie udało się wysłać zgłoszenia. Spróbuj ponownie lub użyj formularza kontaktowego na stronie.";
    } finally {
      leadBusy = false; updateLead(); $(".kx-chat-lead-cancel").disabled = false; $(".kx-chat-reset").disabled = false;
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    queuedSuggestion = "";
    const message = input.value.trim();
    if (pendingOffer && !loading) {
      const answer = message.toLowerCase().replace(/[.!?]+$/g, "").trim();
      const action = /^(tak|tak,? (chcę|chce)|jasne|chętnie|chetnie|zostawię kontakt|zostawie kontakt)$/.test(answer) ? "accept" :
        /^(nie|nie teraz|nie,? (dziękuję|dziekuje))$/.test(answer) ? "decline" : null;
      if (action) {
        addMessage("user", message); input.value = ""; pendingOffer[action].click(); updateSend(); return;
      }
    }
    if (loading || !message) return;
    if (!token && !hasSession()) { status.textContent = "Trwa weryfikacja bezpieczeństwa…"; resetVerification(); return; }
    const turnstileToken = token;
    const currentGeneration = generation;
    loading = true; token = ""; updateSend();
    addMessage("user", message); input.value = "";
    status.textContent = "";
    const typing = document.createElement("p");
    typing.className = "kx-chat-message kx-chat-message--assistant kx-chat-typing";
    typing.setAttribute("role", "status");
    typing.setAttribute("aria-label", "Bielik pisze odpowiedź");
    const typingLabel = document.createElement("span");
    typingLabel.textContent = "Bielik pisze";
    const dots = document.createElement("span");
    dots.className = "kx-chat-typing-dots";
    dots.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 3; i++) dots.append(document.createElement("i"));
    typing.append(typingLabel, dots); thread.append(typing);
    content.scrollTop = content.scrollHeight;
    const requestController = new AbortController();
    controller = requestController;
    const timer = setTimeout(() => requestController.abort(), 55000);
    try {
      const response = await fetch(config.endpoint, {
        method: "POST", credentials: "omit", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, turnstileToken, chatSession: hasSession() ? chatSession : undefined }), signal: requestController.signal,
      });
      const data = await response.json();
      if (currentGeneration !== generation) return;
      if (typeof data.chatSession === "string" && Number.isSafeInteger(data.sessionExpiresAt)) {
        chatSession = data.chatSession; sessionExpiresAt = data.sessionExpiresAt;
        clearTimeout(sessionTimer);
        sessionTimer = setTimeout(() => { chatSession = ""; sessionExpiresAt = 0; resetVerification(); }, Math.max(0, sessionExpiresAt - Date.now()));
      }
      if (data.verificationRequired) { chatSession = ""; sessionExpiresAt = 0; }
      if (!response.ok || typeof data.reply !== "string") throw new Error(data.error || "Czat jest chwilowo niedostępny.");
      typing.remove();
      addMessage("assistant", data.reply);
      updateSuggestions(message);
      content.scrollTop = content.scrollHeight;
      offerContact(message);
      history = [...history, { role: "user", content: message.slice(0, 1000) }, { role: "assistant", content: data.reply.slice(0, 1000) }].slice(-4);
      status.textContent = "";
    } catch (error) {
      if (currentGeneration !== generation) return;
      status.textContent = error.name === "AbortError" ? "Odpowiedź trwa zbyt długo. Spróbuj ponownie." : error.message;
      input.value = message;
    } finally {
      clearTimeout(timer);
      typing.remove();
      if (currentGeneration === generation) { loading = false; if (!hasSession()) resetVerification(); else updateSend(); }
    }
  });
})();
