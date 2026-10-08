(() => {
  "use strict";
  if (document.getElementById("kairox-chat")) return;
  const config = window.KAIROX_CHAT_CONFIG || {};
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = new URL("../css/chat.css", document.currentScript.src).href;
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
        <button class="kx-chat-close" type="button" aria-label="Zamknij czat">×</button>
      </header>
      <div class="kx-chat-intro">
        <p>Nie wiesz, od czego zacząć? Pomogę Ci poznać ofertę i wybrać kierunek.</p>
        <p class="kx-chat-disclosure">To asystent AI w wersji testowej — może się mylić. Wiadomości i krótka historia rozmowy są przesyłane przez Cloudflare do Hugging Face i Public AI. Nie wpisuj danych osobowych ani poufnych informacji.</p>
        <p class="kx-chat-disclosure">Historia w tej karcie znika po odświeżeniu. Dostawcy przetwarzają wiadomości według swoich zasad. <a href="https://publicai.co/tc" target="_blank" rel="noopener noreferrer">Zasady Public AI ↗</a></p>
        <button class="kx-chat-start" type="button">Rozpocznij rozmowę</button>
        <p class="kx-chat-direct"><a href="/formularz-kontaktowy.html">Wolisz porozmawiać z zespołem?</a></p>
      </div>
      <div class="kx-chat-conversation" hidden>
        <div class="kx-chat-thread" role="region" aria-label="Rozmowa z asystentem" tabindex="0"></div>
        <div class="kx-chat-suggestions">
          <button type="button">Ile kosztuje strona?</button>
          <button type="button">Od czego zacząć?</button>
        </div>
        <form class="kx-chat-form">
          <label for="kx-chat-message">Twoje pytanie</label>
          <textarea id="kx-chat-message" rows="2" maxlength="2000" placeholder="Np. mam stronę, ale nie dostaję zapytań…" required data-private="true"></textarea>
          <div class="kx-chat-verification"></div>
          <p class="kx-chat-status" role="status" aria-live="polite"></p>
          <div class="kx-chat-actions"><button class="kx-chat-reset" type="button">Nowa rozmowa</button><button class="kx-chat-send" type="submit" disabled>Wyślij ↗</button></div>
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
  let history = [], token = "", widgetId, loading = false, scriptPromise, controller, generation = 0;
  function updateSend() { send.disabled = loading || !token || !input.value.trim(); }
  function openChat() {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    ($(".kx-chat-intro").hidden ? input : start).focus();
  }
  function closeChat() { panel.hidden = true; launcher.setAttribute("aria-expanded", "false"); launcher.focus(); }
  launcher.addEventListener("click", () => panel.hidden ? openChat() : closeChat());
  $(".kx-chat-close").addEventListener("click", closeChat);
  root.addEventListener("keydown", (event) => { if (event.key === "Escape" && !panel.hidden) { event.preventDefault(); closeChat(); } });
  function addMessage(role, text) {
    const message = document.createElement("p");
    message.className = `kx-chat-message kx-chat-message--${role}`;
    const name = document.createElement("span");
    name.className = "kx-chat-speaker";
    name.textContent = role === "user" ? "Ty" : "Bielik · AI";
    const content = document.createElement("span");
    content.textContent = text;
    message.append(name, content);
    thread.appendChild(message);
    thread.scrollTop = thread.scrollHeight;
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
      await loadTurnstile();
      $(".kx-chat-intro").hidden = true;
      $(".kx-chat-conversation").hidden = false;
      addMessage("assistant", "Cześć! Pomogę Ci poznać ofertę KAIROX. Co chcesz poprawić na swojej stronie?");
      status.textContent = "Trwa weryfikacja bezpieczeństwa…";
      widgetId = window.turnstile.render($(".kx-chat-verification"), {
        sitekey: config.turnstileSiteKey, action: "kairox_chat", theme: "dark", size: "flexible",
        callback: (value) => { token = value; if (!loading && /^(Trwa weryfikacja|Weryfikacja wygasła)/.test(status.textContent)) status.textContent = ""; updateSend(); },
        "expired-callback": () => { token = ""; updateSend(); status.textContent = "Weryfikacja wygasła. Potwierdź ją ponownie."; },
        "error-callback": () => { token = ""; updateSend(); status.textContent = "Weryfikacja się nie powiodła. Odśwież stronę lub użyj formularza kontaktowego."; },
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
  input.addEventListener("input", updateSend);
  $(".kx-chat-suggestions").addEventListener("click", (event) => {
    const suggestion = event.target.closest("button");
    if (!suggestion || loading) return;
    input.value = suggestion.textContent; input.focus(); updateSend();
  });
  function resetVerification() {
    token = ""; updateSend();
    if (widgetId !== undefined) window.turnstile.reset(widgetId);
  }
  $(".kx-chat-reset").addEventListener("click", () => {
    generation++; controller?.abort(); loading = false; history = []; input.value = "";
    thread.replaceChildren(); addMessage("assistant", "Zaczynamy od nowa. W czym mogę pomóc?");
    status.textContent = ""; resetVerification(); input.focus();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (loading || !token || !message) return;
    const turnstileToken = token;
    const currentGeneration = generation;
    loading = true; token = ""; updateSend();
    addMessage("user", message); input.value = "";
    status.textContent = "Bielik przygotowuje odpowiedź…";
    const requestController = new AbortController();
    controller = requestController;
    const timer = setTimeout(() => requestController.abort(), 55000);
    try {
      const response = await fetch(config.endpoint, {
        method: "POST", credentials: "omit", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, turnstileToken }), signal: requestController.signal,
      });
      const data = await response.json();
      if (currentGeneration !== generation) return;
      if (!response.ok || typeof data.reply !== "string") throw new Error(data.error || "Czat jest chwilowo niedostępny.");
      addMessage("assistant", data.reply);
      history = [...history, { role: "user", content: message.slice(0, 1000) }, { role: "assistant", content: data.reply.slice(0, 1000) }].slice(-4);
      status.textContent = "";
    } catch (error) {
      if (currentGeneration !== generation) return;
      status.textContent = error.name === "AbortError" ? "Odpowiedź trwa zbyt długo. Spróbuj ponownie." : error.message;
      input.value = message;
    } finally {
      clearTimeout(timer);
      if (currentGeneration === generation) { loading = false; resetVerification(); }
    }
  });
})();
