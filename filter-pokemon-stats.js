let fs = require('fs');

let contents = fs.readFileSync('GAME_MASTER.json', 'utf8');

let allData = JSON.parse(contents);

let pmData = allData.itemTemplates.filter(d => d.pokemonSettings);

console.log(`All pm data length: ${pmData.length}`);

let props = [
  'pokemonId',
  'stats',
  'familyId',
  'rarity',
];

if (process.argv[2] === 'filter=true') {
  pmData = pmData.map(pm => {
    let _pm = {
      templateId: pm.templateId,
    };

    for (const prop in pm.pokemonSettings) {
      if (props.includes(prop)) {
        _pm[prop] = pm.pokemonSettings[prop];
      }
    }

    _pm.types = [
      pm.pokemonSettings.type,
      pm.pokemonSettings.type2
    ].filter(Boolean);

    _pm.pokedex = +(pm.templateId.match(/V(\d{4})/)[1]);
    return _pm;
  });
}

let outputJSON = (json = {}, fileName = '') => {
  let fileContent = JSON.stringify(json, null, 2);
  fs.writeFileSync(fileName, fileContent);
  console.log(`JSON saved as ${fileName}! ( ${fileContent.length / 1000} kb )`);
};

outputJSON(pmData, 'pm-data.json');

pmData = pmData.reduce((all, pm) => {
  all[pm.pokedex] = all[pm.pokedex] || [];
  all[pm.pokedex].push(pm);
  return all;
}, {});

outputJSON(pmData, 'pm-data-by-dex.json');
fileContent = JSON.stringify(pmData, null, 2);
