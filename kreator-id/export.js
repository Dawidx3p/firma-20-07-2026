async function fetchProjectAsset(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Nie udało się pobrać zasobu (${response.status}).`);
  return response;
}

async function exportProject(doc, name) {
  // Snapshot the current preview before any asynchronous fetches.
  const page = doc.documentElement.cloneNode(true);
  const base = doc.baseURI;
  const files = new Map();
  const assets = new Map();
  function addAsset(url) {
    if (!assets.has(url)) {
      const filename = new URL(url).pathname.split('/').pop();
      const path = `assets/${assets.size + 1}-${filename}`;
      assets.set(url, path);
    }
    return assets.get(url);
  }

  page.querySelector('title').textContent = name;
  page.querySelectorAll('meta[property], meta[name="description"], link[rel="canonical"], [hidden], noscript, script:not([src$="screens.js"]), link[href*="share.css"]').forEach(element => element.remove());
  page.querySelectorAll('.creator-empty').forEach(element => {
    if (element.parentElement.matches('li')) element.parentElement.remove();
    else element.remove();
  });

  const image = page.querySelector('img.creator-photo');
  const jobs = [];
  if (image) {
    const source = image.getAttribute('src');
    if (source?.startsWith('data:image/')) {
      const match = source.match(/^data:image\/([\w.+-]+);base64,/);
      const extensions = { jpeg: 'jpg', png: 'png', webp: 'webp' };
      const path = 'assets/zdjecie.' + (extensions[match?.[1]] || 'img');
      image.setAttribute('src', path);
      jobs.push(fetchProjectAsset(source).then(async response => {
        files.set(path, new Uint8Array(await response.arrayBuffer()));
      }));
    }
  }

  for (const [index, sheet] of [...page.querySelectorAll('link[rel="stylesheet"]')].entries()) {
    const url = new URL(sheet.getAttribute('href'), base);
    const path = `styl-${index + 1}.css`;
    sheet.setAttribute('href', path);
    jobs.push(fetchProjectAsset(url).then(async response => {
      const css = await response.text();
      files.set(path, css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (original, quote, ref) => {
        const asset = new URL(ref.trim(), url);
        return asset.origin === url.origin ? `url("${addAsset(asset.href)}")` : original;
      }));
    }));
  }

  const previewStyle = page.querySelector('style');
  if (previewStyle) {
    files.set('podglad.css', previewStyle.textContent);
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('href', 'podglad.css');
    previewStyle.replaceWith(link);
  }

  const screens = page.querySelector('script[src$="screens.js"]');
  if (screens) {
    const url = new URL(screens.getAttribute('src'), base);
    screens.setAttribute('src', 'screens.js');
    jobs.push(fetchProjectAsset(url).then(async response => {
      files.set('screens.js', await response.text());
    }));
  }

  await Promise.all(jobs);
  await Promise.all([...assets].map(async ([url, path]) => {
    const response = await fetchProjectAsset(url);
    files.set(path, new Uint8Array(await response.arrayBuffer()));
  }));
  files.set('index.html', '<!doctype html>\n' + page.outerHTML);
  files.set('README.txt', 'Rozpakuj cały ZIP i otwórz index.html w przeglądarce.\nPliki możesz też umieścić razem na hostingu statycznym.\nFonty Google i odnośniki zewnętrzne korzystają z internetu.\n');

  const url = URL.createObjectURL(createZip(files));
  const download = document.createElement('a');
  download.href = url;
  download.download = 'digital-id.zip';
  document.body.append(download);
  download.click();
  download.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
