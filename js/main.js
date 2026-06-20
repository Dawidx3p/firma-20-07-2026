const modal = document.getElementById("contactModal");

const openButtons = document.querySelectorAll(".open-form");

const closeButton = document.querySelector(".close-modal");

const overlay = document.querySelector(".modal-overlay");

const email = document.getElementById("email");

const phone = document.getElementById("phone");

const privacy = document.getElementById("privacy");

const submitButton = document.getElementById("submitButton");

const form = document.getElementById("contactForm");

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
  const hasEmail = email.value.trim() !== "";
  const hasPhone = phone.value.trim() !== "";
  const phoneValue = phone.value.trim();

if (phoneValue !== "" && !isValidPhone(phoneValue)) {

  phone.classList.add("field-error");

  return;
}
  if (!hasEmail && !hasPhone) {

    email.classList.add("field-error");
    phone.classList.add("field-error");

    return;
  }

  if (!privacy.checked) {

    privacy.parentElement.classList.add("checkbox-error");

    return;
  }

  try {

    submitButton.disabled = true;
    submitButton.textContent = "Wysyłanie...";

    const response = await fetch("/api/contact", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        name: document.getElementById("name")?.value || "",

        email: email.value,

        phone: phone.value,

        contactMethod:
          document.getElementById("contactMethod")?.value || "",

        challenge:
          document.getElementById("challenge")?.value || ""

      })

    });

    if (!response.ok) {
      throw new Error("Błąd wysyłki");
    }

    alert("Dziękujemy! Skontaktujemy się z Tobą.");

    closeModal();

  } catch (error) {

    alert(
      "Nie udało się wysłać formularza. Spróbuj ponownie."
    );

  } finally {

    submitButton.textContent =
      "Wyślij zgłoszenie";

    validateForm();

  }

});

validateForm();

closeButton.addEventListener("click", closeModal);

overlay.addEventListener("click", closeModal);