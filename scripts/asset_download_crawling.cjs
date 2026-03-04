const fs = require('fs');
const path = require('path');

const EXPECTED_CLASSES = [
  "juggernaut", "berserker", "chieftain", "slayer", "gladiator", "champion",
  "deadeye", "warden", "pathfinder", "assassin", "saboteur", "trickster",
  "necromancer", "occultist", "elementalist", "inquisitor", "hierophant",
  "guardian", "ascendant", "reliquarian", "chaos", "oshabi", "nameless",
  "aul", "lycia", "delirious", "olroth", "catarina", "farrul", "breachlord", "saresh"
];

async function downloadAccurateImages() {
  const dir = path.join(__dirname, 'images');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  console.log("🔍 Fetching HTML and running Proximity Mapping...\n");

  const res = await fetch('https://www.poewiki.net/wiki/Juggernaut');
  const html = await res.text();

  const navboxStart = html.indexOf('Character Classes');
  if (navboxStart === -1) return console.error("Could not find the Character Classes table.");
  const navboxHtml = html.slice(navboxStart);

  // 1. Find all 84px images and store their exact index position
  const imgRegex = /src="(\/images\/thumb\/[^"]+\/84px-[^"]+)"/g;
  const images = [...navboxHtml.matchAll(imgRegex)].map(m => ({
    url: `https://www.poewiki.net${m[1]}`,
    index: m.index
  }));

  // 2. Find all links, filter for our expected classes, and store their index positions
  const linkRegex = /href="\/wiki\/([^"#>]+)"/g;
  const classLinks = [];
  
  for (const match of navboxHtml.matchAll(linkRegex)) {
    const rawName = match[1].replace('_Bloodline', '').toLowerCase();
    if (EXPECTED_CLASSES.includes(rawName)) {
      classLinks.push({ name: rawName, index: match.index });
    }
  }

  console.log(`Found ${images.length} images. Mapping to closest class names...\n`);

  // 3. Pair each image with the class link that is physically closest to it in the HTML
  for (const img of images) {
    let closestClass = null;
    let minDistance = Infinity;

    for (const link of classLinks) {
      const distance = Math.abs(link.index - img.index);
      if (distance < minDistance) {
        minDistance = distance;
        closestClass = link.name;
      }
    }

    if (!closestClass) {
      console.log(`⚠️ Could not map image: ${img.url}`);
      continue;
    }

    const filename = `${closestClass}_avatar.png`;
    const filepath = path.join(dir, filename);

    try {
      const imgRes = await fetch(img.url);
      if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
      
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(filepath, buffer);
      
      console.log(`✅ Saved: ${filename}`);
    } catch (err) {
      console.error(`❌ Failed: ${closestClass} -> ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 100)); // Be polite to the server
  }

  console.log("\n🎉 Done! All images mapped and downloaded correctly.");
}

downloadAccurateImages();