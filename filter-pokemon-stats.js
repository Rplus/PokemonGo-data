let fs = require('fs');

let contents = fs.readFileSync('GAME_MASTER.json', 'utf8');

let allData = JSON.parse(contents);

let pmData = allData.itemTemplates.filter(d => d.pokemonSettings);

console.log(`All pm data length: ${pmData.length}`);

let props = [
  'pokemonId',
  'type',
  'type2',
  'stats',
  'familyId',
  'rarity',
  'candyToEvolve',
  'kmBuddyDistance',
];

if (process.argv[2] === 'filter=true') {
  pmData = pmData.map(pm => {
    for (const prop in pm.pokemonSettings) {
      if (!props.includes(prop)) {
        delete pm.pokemonSettings[prop];
      }
    }
    pm.pokemonSettings.pokedex = +pm.templateId.match(/V(\d{4})/)[1];
    return pm;
  });
}

let fileContent = JSON.stringify(pmData, null, 2);
fs.writeFileSync('pm-data.json', fileContent);
console.log(`JSON saved! ( ${fileContent.length / 1000} kb )`);
