"use strict";

const form = document.getElementById("contactForm");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const privacy = document.getElementById("privacy");
const submitButton = document.getElementById("submitButton");
const formStatus = document.getElementById("formStatus");
const website = document.getElementById("website");
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mojoqowy";

const websiteFromUrl = new URLSearchParams(window.location.search).get("website");

if (websiteFromUrl) website.value = websiteFromUrl;

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isValidPhone(value) {
  return /^\+?[0-9]{9,15}$/.test(value.replace(/[\s()-]/g, ""));
}

function validateForm() {
  const hasContact = email.value.trim() !== "" || phone.value.trim() !== "";
  submitButton.disabled = !(hasContact && privacy.checked);

  if (hasContact) {
    email.classList.remove("field-error");
    phone.classList.remove("field-error");
  }
  if (privacy.checked) privacy.parentElement.classList.remove("checkbox-error");
}

[email, phone].forEach((field) => field.addEventListener("input", validateForm));
privacy.addEventListener("change", validateForm);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "";
  formStatus.className = "form-status";

  const emailValue = email.value.trim();
  const phoneValue = phone.value.trim();
  const hasContact = emailValue !== "" || phoneValue !== "";
  const validEmail = emailValue === "" || isValidEmail(emailValue);
  const validPhone = phoneValue === "" || isValidPhone(phoneValue);

  email.classList.toggle("field-error", !hasContact || !validEmail);
  phone.classList.toggle("field-error", !hasContact || !validPhone);
  privacy.parentElement.classList.toggle("checkbox-error", !privacy.checked);

  if (!hasContact || !validEmail || !validPhone || !privacy.checked) {
    formStatus.textContent = "Sprawdź zaznaczone pola.";
    formStatus.classList.add("is-error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Wysyłanie...";

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: document.getElementById("name").value.trim(),
        website: website.value.trim(),
        email: emailValue,
        _replyto: emailValue,
        phone: phoneValue,
        contactMethod: document.getElementById("contactMethod").value,
        challenge: document.getElementById("challenge").value.trim(),
        sourcePage: window.location.pathname,
        consent: true
      })
    });

    if (!response.ok) throw new Error("Formspree error");

    form.reset();
    formStatus.textContent = "Dziękujemy! Za chwilę wrócisz na stronę główną.";
    formStatus.classList.add("is-success");

    window.setTimeout(() => {
      window.location.assign("index.html");
    }, 1800);
  } catch (error) {
    formStatus.textContent = "Nie udało się wysłać formularza. Spróbuj ponownie.";
    formStatus.classList.add("is-error");
  } finally {
    submitButton.textContent = "Wyślij zgłoszenie";
    validateForm();
  }
});

validateForm();

document.querySelectorAll(".copy-email").forEach((button) => {
  button.addEventListener("click", async () => {
    const emailAddress = button.dataset.email;
    const status = button.parentElement.querySelector(".copy-email-status");

    try {
      await navigator.clipboard.writeText(emailAddress);
    } catch (error) {
      const temporaryField = document.createElement("textarea");
      temporaryField.value = emailAddress;
      temporaryField.setAttribute("readonly", "");
      temporaryField.style.position = "fixed";
      temporaryField.style.opacity = "0";
      document.body.appendChild(temporaryField);
      temporaryField.select();
      document.execCommand("copy");
      temporaryField.remove();
    }

    button.textContent = "Skopiowano";
    status.textContent = `Skopiowano adres ${emailAddress}`;

    window.setTimeout(() => {
      button.textContent = "Kopiuj";
      status.textContent = "";
    }, 2200);
  });
});
