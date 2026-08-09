"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const navList = document.querySelector(".nav-list");
const sections = document.querySelectorAll("section[id]");
const links = document.querySelectorAll(".toc a");

const animatedElements = document.querySelectorAll(
  ".section-header, .message, .case-card, .path-card, .process-card, .pricing-card, .cta-content"
);

animatedElements.forEach((element, index) => {
  element.classList.add("reveal");
  element.style.setProperty("--delay", `${Math.min(index * 0.04, 0.24)}s`);
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -80px 0px" }
  );

  animatedElements.forEach((element) => revealObserver.observe(element));
} else {
  animatedElements.forEach((element) => element.classList.add("is-visible"));
}

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
  menuToggle.addEventListener("click", () => {
    const isOpen = navList.classList.toggle("active");
    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navList.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navList.classList.remove("active");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const websiteCheckForm = document.getElementById("websiteCheckForm");

if (websiteCheckForm) {
  const websiteInput = document.getElementById("websiteCheckUrl");
  const websiteError = document.getElementById("websiteCheckError");

  websiteCheckForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const rawValue = websiteInput.value.trim();
    const normalizedValue = /^https?:\/\//i.test(rawValue)
      ? rawValue
      : `https://${rawValue}`;

    try {
      const websiteUrl = new URL(normalizedValue);

      if (!websiteUrl.hostname.includes(".")) throw new Error("Invalid hostname");

      websiteInput.classList.remove("field-error");
      websiteError.textContent = "";
      window.location.assign(
        `formularz-kontaktowy.html?website=${encodeURIComponent(websiteUrl.href)}`
      );
    } catch (error) {
      websiteInput.classList.add("field-error");
      websiteError.textContent = "Wpisz poprawny adres, np. twojafirma.pl";
      websiteInput.focus();
    }
  });

  websiteInput.addEventListener("input", () => {
    websiteInput.classList.remove("field-error");
    websiteError.textContent = "";
  });
}

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
