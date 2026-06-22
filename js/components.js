async function loadComponent(selector, file) {
    const response = await fetch(file);
    const html = await response.text();
  
    document.querySelector(selector).innerHTML = html;
  }

document.addEventListener("DOMContentLoaded", async () => {

    await loadComponent(
      "#modal-container",
      "components/modal.html"
    );
  
    await loadComponent(
      "#toast-container",
      "components/toast.html"
    );
  
    document.dispatchEvent(
      new Event("componentsLoaded")
    );
  
  });