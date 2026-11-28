const profile = {
  games: [
    ['VALORANT', 'NeonVex#VEX'],
    ['Counter-Strike 2', 'neonvex_cs'],
    ['Fortnite', 'NeonVexFN'],
    ['League of Legends', 'NeonVex#EUW'],
    ['Rocket League', 'VexOverboost'],
    ['Minecraft', 'NeonVexMC'],
    ['Apex Legends', 'NeonVexApex'],
    ['Call of Duty: Warzone', 'NeonVex#4837261'],
    ['Overwatch 2', 'NeonVex#28461'],
    ['Tom Clancy’s Rainbow Six Siege', 'NeonVex.R6'],
    ['PUBG: Battlegrounds', 'VexDropzone'],
    ['Battlefield 6', 'NeonVexBF'],
    ['Marvel Rivals', 'VexAfterDark'],
    ['The Finals', 'NeonVex#4820'],
    ['Destiny 2', 'NeonVex#7624'],
    ['Halo Infinite', 'NeonVexX'],
    ['Team Fortress 2', 'NeonVexTF'],
    ['Deadlock', 'NeonVexDL'],
    ['Dota 2', 'VexMidnight'],
    ['Teamfight Tactics', 'NeonVex#EUW'],
    ['League of Legends: Wild Rift', 'NeonVex#WR'],
    ['Hearthstone', 'NeonVex#28461'],
    ['Magic: The Gathering Arena', 'NeonVex#37182'],
    ['World of Warcraft', 'Vexnight · Draenor'],
    ['Final Fantasy XIV', 'Neon Vex · Odin'],
    ['The Elder Scrolls Online', '@NeonVexESO'],
    ['Guild Wars 2', 'NeonVex.4827'],
    ['Old School RuneScape', 'NeonVexOSRS'],
    ['Path of Exile 2', 'NeonVex#7412'],
    ['Diablo IV', 'NeonVex#28461'],
    ['Warframe', 'NeonVex#450'],
    ['Genshin Impact', 'UID 700123456 · Europa'],
    ['Honkai: Star Rail', 'UID 700456789 · Europa'],
    ['Zenless Zone Zero', 'UID 1500123456 · Europa'],
    ['Roblox', '@NeonVexPlay'],
    ['Grand Theft Auto Online', 'NeonVexLS'],
    ['Red Dead Online', 'VexMidnightRDO'],
    ['Sea of Thieves', 'NeonVexX'],
    ['Rust', 'NeonVexRust'],
    ['DayZ', 'VexAfterDark'],
    ['ARK: Survival Ascended', 'VexRaptor'],
    ['No Man’s Sky', 'NeonVexNMS'],
    ['Deep Rock Galactic', 'VexMiner'],
    ['Helldivers 2', 'NeonVexHD'],
    ['Dead by Daylight', 'NeonVex#1a4b'],
    ['Phasmophobia', 'VexAfterDark'],
    ['Among Us', 'NeonVexCrew'],
    ['Fall Guys', 'NeonVexFN'],
    ['Forza Horizon 5', 'NeonVexX'],
    ['Gran Turismo 7', 'NeonVexPS'],
    ['Assetto Corsa Competizione', 'Neon Vex'],
    ['Trackmania', 'NeonVex.TM'],
    ['F1 25', 'NeonVexRace'],
    ['EA Sports FC 26', 'NeonVexFC'],
    ['NBA 2K26', 'NeonVex2K'],
    ['Tekken 8', 'NeonVexT8'],
    ['Street Fighter 6', 'VexDrive'],
    ['Mortal Kombat 1', 'NeonVexMK'],
    ['Brawlhalla', 'NeonVexBH'],
    ['Brawl Stars', 'NeonVex · #9Q8P2LYV'],
    ['Clash Royale', 'NeonVex · #8P2YQ9LV'],
    ['Clash of Clans', 'NeonVex · #2Y9LP8QV'],
    ['Pokémon GO', 'NeonVexGO · 1234 5678 9012'],
    ['Mobile Legends: Bang Bang', 'VexShadow'],
    ['osu!', 'NeonVexRhythm'],
  ],
  platforms: [
    ['Steam', 'neonvex_cs', 'https://store.steampowered.com/'],
    ['PlayStation Network', 'NeonVexPS', 'https://www.playstation.com/'],
    ['Xbox Network', 'NeonVexX', 'https://www.xbox.com/'],
    ['Nintendo Switch', 'SW-1234-5678-9012', 'https://www.nintendo.com/'],
    ['Epic Games', 'NeonVexFN', 'https://www.epicgames.com/'],
    ['Riot Games', 'NeonVex#VEX', 'https://www.riotgames.com/'],
    ['Battle.net', 'NeonVex#28461', 'https://battle.net/'],
    ['Ubisoft Connect', 'NeonVex.R6', 'https://www.ubisoft.com/'],
    ['EA app', 'NeonVexBF', 'https://www.ea.com/'],
    ['Rockstar Games', 'NeonVexLS', 'https://www.rockstargames.com/'],
    ['GOG', 'NeonVexGOG', 'https://www.gog.com/'],
    ['FACEIT', 'neonvex', 'https://www.faceit.com/'],
  ],
  socials: [
    ['Discord', 'neonvex.demo', 'https://discord.com/'],
    ['Twitch', 'neonvexlive', 'https://www.twitch.tv/'],
    ['YouTube', '@NeonVexPlays', 'https://www.youtube.com/'],
    ['TikTok', '@neonvex.clips', 'https://www.tiktok.com/'],
    ['Instagram', '@neonvex.gg', 'https://www.instagram.com/'],
    ['X', '@neonvexgg', 'https://x.com/'],
    ['Bluesky', '@neonvex.example', 'https://bsky.app/'],
    ['Kick', 'neonvexlive', 'https://kick.com/'],
    ['Reddit', 'u/NeonVexDemo', 'https://www.reddit.com/'],
  ],
};

const list = document.querySelector('.entries');
const search = document.querySelector('input[type="search"]');
const filters = [...document.querySelectorAll('[data-group]')];
const empty = document.querySelector('.empty');
const count = document.querySelector('.count');
const hint = document.querySelector('.directory-hint');
const status = document.querySelector('.status');
let group = 'games';

function render() {
  const query = search.value.trim().toLocaleLowerCase('pl');
  const results = profile[group].filter(([name, handle]) =>
    `${name} ${handle}`.toLocaleLowerCase('pl').includes(query)
  );

  list.replaceChildren(...results.map(([name, handle, url]) => {
    const item = document.createElement('li');
    const tile = document.createElement(url ? 'a' : 'button');
    tile.className = 'entry tile';
    const title = document.createElement('strong');
    title.textContent = name;
    const id = document.createElement('span');
    id.className = 'handle';
    id.textContent = handle;

    const action = document.createElement('span');
    action.className = 'tile-action';
    action.setAttribute('aria-hidden', 'true');
    action.textContent = url ? '↗' : '⧉';

    if (url) {
      tile.href = url;
    } else {
      tile.type = 'button';
      tile.setAttribute('aria-label', `Kopiuj identyfikator: ${name}, ${handle}`);
      tile.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(handle);
          status.textContent = `Skopiowano: ${handle}`;
        } catch {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(id);
          selection.removeAllRanges();
          selection.addRange(range);
          status.textContent = 'Nick zaznaczony do ręcznego skopiowania.';
        }
      });
    }
    tile.append(title, id, action);
    item.append(tile);
    return item;
  }));

  hint.textContent = group === 'games'
    ? 'Wybierz grę, aby skopiować nick.'
    : 'Przykładowe nicki i linki do stron serwisów.';
  list.scrollTop = 0;
  list.hidden = results.length === 0;
  empty.hidden = results.length !== 0;
  count.textContent = `Wyniki: ${results.length} / ${profile[group].length}`;
  status.textContent = '';
}

const placeholders = {
  games: 'Szukaj gry lub nicku',
  platforms: 'Szukaj platformy lub nicku',
  socials: 'Szukaj serwisu lub nicku',
};

for (const filter of filters) {
  filter.addEventListener('click', () => {
    group = filter.dataset.group;
    for (const button of filters) {
      button.setAttribute('aria-pressed', String(button === filter));
    }
    search.value = '';
    search.placeholder = placeholders[group];
    render();
  });
}

search.addEventListener('input', render);
render();
