const careerContent = document.querySelector('.career .entries');

for (const group of document.querySelectorAll('[data-switcher]')) {
  const buttons = [...group.querySelectorAll('button[aria-controls]')];

  group.addEventListener('click', (event) => {
    const active = event.target.closest('button[aria-controls]');
    if (!buttons.includes(active) || active.getAttribute('aria-pressed') === 'true') return;

    for (const button of buttons) {
      const selected = button === active;
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-pressed', String(selected));
      panel.hidden = !selected;
    }
    careerContent.scrollTop = 0;
  });
}
