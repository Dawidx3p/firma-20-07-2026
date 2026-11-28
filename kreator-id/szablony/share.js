const shareDialog = document.querySelector('#share-dialog');
const shareStatus = shareDialog.querySelector('.share-status');
const shareAddress = shareDialog.querySelector('.share-address');

document.querySelector('.share-button').addEventListener('click', () => {
  shareStatus.textContent = '';
  shareAddress.hidden = true;
  shareDialog.showModal();
});

shareDialog.querySelector('.share-copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(shareAddress.value);
    shareStatus.textContent = 'Link skopiowany.';
  } catch {
    shareAddress.hidden = false;
    shareAddress.select();
    shareStatus.textContent = 'Skopiuj zaznaczony link.';
  }
});
