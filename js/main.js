"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const navList = document.querySelector(".nav-list");
const sections = document.querySelectorAll("section[id]");
const links = document.querySelectorAll(".toc a");

if (sections.length && links.length) {
  window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach((section) => {
      if (window.scrollY >= section.offsetTop - 150) current = section.id;
    });

    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
  });
}

if (menuToggle && navList) {
  function closeMenu(returnFocus = false) {
    navList.classList.remove("active");
    menuToggle.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Otwórz menu");
    document.body.classList.remove("menu-open");
    if (returnFocus) menuToggle.focus();
  }
  menuToggle.addEventListener("click", () => {
    const isOpen = navList.classList.toggle("active");
    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Zamknij menu" : "Otwórz menu");
    document.body.classList.toggle("menu-open", isOpen);
  });

  navList.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && navList.classList.contains("active")) {
      event.preventDefault(); closeMenu(true);
    }
  });
  document.addEventListener("click", event => {
    if (navList.classList.contains("active") && !event.target.closest(".navbar")) closeMenu();
  });
}

const websiteCheckForm = document.getElementById("websiteCheckForm");

if (websiteCheckForm) {
  const websiteInput = document.getElementById("websiteCheckUrl");
  const websiteError = document.getElementById("websiteCheckError");

  websiteCheckForm.addEventListener("submit", (event) => {
    const value = websiteInput.value.trim();
    if (!value) {
      websiteInput.value = "";
      return;
    }

    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      if (!url.hostname.includes(".") || url.username || url.password) throw new Error("Niepoprawny adres");
      websiteInput.value = url.href;
    } catch {
      event.preventDefault();
      websiteInput.setAttribute("aria-invalid", "true");
      websiteError.textContent = "Wpisz poprawny adres, np. twojafirma.pl";
      websiteInput.focus();
    }
  });

  websiteInput.addEventListener("input", () => {
    websiteInput.removeAttribute("aria-invalid");
    websiteError.textContent = "";
  });
}

document.querySelectorAll(".copy-email").forEach((button) => {
  let resetTimer;
  let copying = false;
  const label = button.textContent;
  button.addEventListener("click", async () => {
    if (copying) return;
    copying = true;
    window.clearTimeout(resetTimer);
    const emailAddress = button.dataset.email;
    const status = button.parentElement.querySelector(".copy-email-status");
    let copied = false;

    try {
      await navigator.clipboard.writeText(emailAddress);
      copied = true;
    } catch {
      const temporaryField = document.createElement("textarea");
      temporaryField.value = emailAddress;
      temporaryField.setAttribute("readonly", "");
      temporaryField.style.position = "fixed";
      temporaryField.style.opacity = "0";
      document.body.appendChild(temporaryField);
      try {
        temporaryField.select();
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      } finally {
        temporaryField.remove();
        button.focus({ preventScroll: true });
      }
    }

    button.dataset.copyState = copied ? "success" : "error";
    button.textContent = copied ? "Skopiowano" : "Spróbuj znów";
    status.textContent = copied ? `Skopiowano adres ${emailAddress}` : "Nie udało się skopiować adresu e-mail.";
    copying = false;

    resetTimer = window.setTimeout(() => {
      button.textContent = label;
      delete button.dataset.copyState;
      status.textContent = "";
    }, 2200);
  });
});
