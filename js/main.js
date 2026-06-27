const modal = document.getElementById("contactModal");
const openButtons = document.querySelectorAll(".open-form");
const closeButton = document.querySelector(".close-modal");
const overlay = document.querySelector(".modal-overlay");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const privacy = document.getElementById("privacy");
const submitButton = document.getElementById("submitButton");
const form = document.getElementById("contactForm");
const menuToggle = document.querySelector(".menu-toggle");
const navList = document.querySelector(".nav-list");
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mojoqowy";
const successToast = document.getElementById("successToast");
const sections = document.querySelectorAll("section[id]");
const links = document.querySelectorAll(".toc a");
const animatedElements = document.querySelectorAll(
  ".section-header, .message, .case-card, .path-card, .process-card, .pricing-card, .cta-content"
);

animatedElements.forEach((element, index) => {
  element.classList.add("reveal");
  element.style.setProperty("--delay", `${Math.min(index * 0.04, 0.24)}s`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.14,
    rootMargin: "0px 0px -80px 0px"
  }
);

animatedElements.forEach((element) => {
  revealObserver.observe(element);
});

window.addEventListener("scroll", () => {

  let current = "";

  sections.forEach(section => {

    const top = section.offsetTop - 150;

    if (scrollY >= top) {
      current = section.id;
    }

  });

  links.forEach(link => {

    link.classList.remove("active");

    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
    }

  });

});

menuToggle.addEventListener("click", () => {
  const isOpen = navList.classList.toggle("active");

  menuToggle.classList.toggle("active");
  menuToggle.setAttribute("aria-expanded", isOpen);
});

navList.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navList.classList.remove("active");
    menuToggle.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

openButtons.forEach(button => {
  button.addEventListener("click", () => {
    modal.classList.add("active");
  });
});

function closeModal() {

  modal.classList.remove("active");

  form.reset();

  email.classList.remove("field-error");
  phone.classList.remove("field-error");

  privacy.parentElement.classList.remove("checkbox-error");

  validateForm();
}

function showSuccessToast() {
  successToast.classList.add("show");

  setTimeout(() => {
    successToast.classList.remove("show");
  }, 4000);
}

function isValidEmail(emailAddress) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailAddress);
}

function isValidPhone(phoneNumber) {
  return /^\+?[0-9]{9,15}$/.test(phoneNumber);
}

function validateForm() {

  const hasEmail = email.value.trim() !== "";

  const hasPhone = phone.value.trim() !== "";

  const validContact = hasEmail || hasPhone;

  const validPrivacy = privacy.checked;

  submitButton.disabled = !(validContact && validPrivacy);

  if (validContact) {

    email.classList.remove("field-error");

    phone.classList.remove("field-error");

  }

  if (validPrivacy) {

    privacy.parentElement.classList.remove("checkbox-error");

  }

}

email.addEventListener("input", validateForm);

phone.addEventListener("input", validateForm);

privacy.addEventListener("change", validateForm);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailValue = email.value.trim();
  const phoneValue = phone.value.trim();

  const validEmail = emailValue === "" || isValidEmail(emailValue);
  const validPhone = phoneValue === "" || isValidPhone(phoneValue);
  const hasContact = emailValue !== "" || phoneValue !== "";

  if (!hasContact) {
    email.classList.add("field-error");
    phone.classList.add("field-error");
    return;
  }

  if (!validEmail) {
    email.classList.add("field-error");
    return;
  }

  if (!validPhone) {
    phone.classList.add("field-error");
    return;
  }

  if (!privacy.checked) {
    privacy.parentElement.classList.add("checkbox-error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Wysyłanie...";

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        name: document.getElementById("name")?.value.trim() || "",
        email: emailValue,
        _replyto: emailValue,
        phone: phoneValue,
        contactMethod: document.getElementById("contactMethod")?.value || "",
        challenge: document.getElementById("challenge")?.value.trim() || "",
        sourcePage: window.location.pathname,
        consent: privacy.checked
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(errorData);
      throw new Error("Formspree error");
    }

    closeModal();
    showSuccessToast();

  } catch (error) {
    alert("Nie udało się wysłać formularza. Spróbuj ponownie.");
  } finally {
    submitButton.textContent = "Wyślij zgłoszenie";
    validateForm();
  }
});

validateForm();

closeButton.addEventListener("click", closeModal);

overlay.addEventListener("click", closeModal);