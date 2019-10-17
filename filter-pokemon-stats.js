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

    let isotope = _pm.templateId.split(_pm.pokemonId)[1];
    if (isotope) {
      _pm.isotope = isotope.replace(/^\_/, '');
    }

    _pm.types = [
      pm.pokemonSettings.type,
      pm.pokemonSettings.type2
    ].filter(Boolean);

    _pm.pokedex = +(pm.templateId.match(/V(\d{4})/)[1]);
    return _pm;
  });
}

let outputJSON = (json = {}, fileName = '', jsonSpace = 2) => {
  let fileContent = JSON.stringify(json, null, jsonSpace);
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

((d) => {
  var arr = [];
  for (let dex in d) {
    let a = [...d[dex]];
    if (d[dex].length !== 1) {
      a = a.filter(pm => pm.isotope);
    }
    a.forEach(i => {
      let ads = `${i.stats.baseAttack}-${i.stats.baseDefense}-${i.stats.baseStamina}`;
      let o = {
        dex: +dex,
        ads: ads.split('-').map(Number),
      };
      if (i.isotope) {
        o.isotope = i.isotope.toLowerCase();
      }
      arr.push(o);
    });
  }

  outputJSON(arr, 'pm-data-with-ads.json', 2);
})(pmData);



((allData) => {
  let replacePT = (str) => str.replace('POKEMON_TYPE', '$PT')
  let _data = allData.itemTemplates;

  let whitelistForPMS = [
    'pokemonId',
    'type',
    'type2',
    'stats',
    'quickMoves',
    'cinematicMoves',
    'pokedexHeightM',
    'pokedexWeightKg',
    'familyId',
    'candyToEvolve',
    'kmBuddyDistance',
    'evolutionBranch',
    'thirdMove',
    'isTransferable',
    'isDeployable',
    'gender',
  ];

  let whitelistForMoves = [
    'movementId',
    'pokemonType',
    'power',
    'durationMs',
    'damageWindowStartMs',
    'damageWindowEndMs',
    'energyDelta',
    'uniqueId',
    'type',
    'energyDelta',
    'buffs',
  ];

  _data
    .forEach(d => {
      if (d.combatMove) {
        delete d.combatMove.vfxName;
        for (let i in d.combatMove) {
          if (whitelistForMoves.indexOf(i) === -1) {
            delete d.combatMove[i];
          }
        }
      }
      if (d.moveSettings) {
        delete d.moveSettings.vfxName;
        for (let i in d.moveSettings) {
          if (whitelistForMoves.indexOf(i) === -1) {
            delete d.moveSettings[i];
          }
        }
      }
      if (d.pokemonSettings) {
        for (let i in d.pokemonSettings) {
          if (whitelistForPMS.indexOf(i) === -1) {
            delete d.pokemonSettings[i];
          }
        }
      }

      if (d.genderSettings) {
        let tid = d.templateId.replace('SPAWN_', '');
        let _target = _data.find(d => d.templateId === tid);
        if (!_target) { return; }

        _target.pokemonSettings.gender = d.genderSettings.gender;
      }

      for (let i in d) {
        if (typeof d[i] !== 'string') {
          for (let j in d[i]) {
            if (j.indexOf('ype') !== -1 && typeof d[i][j] === 'string') {
              d[i][j] = replacePT(d[i][j]);
            }
          }
        }
      }
    });

  let op = {
    pms: [],
    // forms: _data.filter(d => d.formSettings),
    moves: _data.filter(d => d.moveSettings),
    combat_moves: _data.filter(d => d.combatMove),
  };

  let _forms = _data.filter(d => d.formSettings);

  _forms.forEach(f => {
    let _id = f.templateId.replace('FORMS_', '');
    if (f.formSettings.forms) {
      f.formSettings.forms.forEach(f2 => {
        let _form = f2.form.replace(f.formSettings.pokemon, '');
        let tid = `${_id}${_form}`;
        f2.rid = _data.find(d => d.templateId === tid) ? tid : _id;
      });
    } else {
    }
  });

  op.pms = _forms.map(f => {
    let _id = f.templateId.replace('FORMS_', '');
    let _ids = [];
    let o = {
      templateId: _id,
    };

    let _of = f.formSettings.forms;

    if (_of) {
      _ids = _ids.concat(_of.map(i => i.rid));
    } else {
      _ids.push(_id);
    }

    _ids = [...new Set(_ids)];
    o.pms = _ids.map(i => {
      let _pm = _data.find(d => d.templateId === i);
      _pm.pokemonSettings.assetBundleValue = _of && _of.find(i => i.rid === _pm.templateId).assetBundleValue;
      return _pm;
    });

    return o;
  });


  op.types = op.moves.reduce((all, m) => {
    let _type = m.moveSettings.pokemonType;
    if (all.indexOf(_type) === -1) {
      all.push(_type);
    }
    return all;
  }, [])
  .sort();

  outputJSON(op, 'pm-index.json', 2);
})(allData);
