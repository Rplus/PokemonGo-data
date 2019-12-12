const folder = './dist/pokemongo-game-master/versions';
const folder_old = './dist/old/';
const fs = require('fs');

let versions = [];

let outputJSON = (json = {}, fileName = '', jsonSpace = 2) => {
  let fileContent = JSON.stringify(json, null, jsonSpace);
  fs.writeFileSync(fileName, fileContent);
  console.log(`JSON saved as ${fileName}! ( ${fileContent.length / 1000} kb )`);
};

fs.readdirSync(folder).forEach(version => {
  if (isNaN(version)) {
    return;
  }
  let fileName = `${folder}/${version}/GAME_MASTER.json`;
  console.log(fileName);

  versions.push([
    version,
    JSON.parse(fs.readFileSync(fileName, 'utf8')),
  ]);
});

let collectPMWithMoves = (data) => {
  return data[1].itemTemplates.filter(d => d.pokemonSettings)
  .map(pm => {
    return {
      templateId: pm.templateId,
      cinematicMoves: pm.pokemonSettings.cinematicMoves,
      quickMoves: pm.pokemonSettings.quickMoves,
    }
  });
};

let uniArr = (arr) => {
  return [...new Set(arr)];
};

let allPmWithMoves = versions
    .map(v => collectPMWithMoves(v))
    .flat()
    .reduce((all, pm, index) => {
      let target = all[pm.templateId];
      if (!all[pm.templateId]) {
        all[pm.templateId] = {... pm};
      }
      if (index < 10) {
        // console.log(all);
      }
      all[pm.templateId].cinematicMoves = uniArr(
        (all[pm.templateId].cinematicMoves || []).concat(pm.cinematicMoves)
      );
      all[pm.templateId].quickMoves = uniArr(
        (all[pm.templateId].quickMoves || []).concat(pm.quickMoves)
      );
      return all;
    }, {});

let op = Object.values(allPmWithMoves)
  .sort((a, b) => +a.templateId.slice(2, 5) - b.templateId.slice(2, 5))
  .reduce((all, item) => {
    all[item.templateId] = item;
    return all;
  }, {});

outputJSON(op, 'pm-moves.json', 2);
