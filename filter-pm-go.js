let fs = require('fs');

let contents = fs.readFileSync('GAME_MASTER.json', 'utf8');

let allData = JSON.parse(contents);

let outputJSON = (json = {}, fileName = '', jsonSpace = 2) => {
  let fileContent = JSON.stringify(json, null, jsonSpace);
  fs.writeFileSync(fileName, fileContent);
  console.log(`JSON saved as ${fileName}! ( ${fileContent.length / 1000} kb )`);
};

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
    moves:
      _data
      .filter(d => d.moveSettings)
      .sort((a, b) => b.moveSettings.energyDelta - a.moveSettings.energyDelta),
    combat_moves:
      _data
      .filter(d => d.combatMove)
      .sort((a, b) => b.combatMove.energyDelta - a.combatMove.energyDelta),
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
  outputJSON(op, 'pm-index.min.json', null);
})(allData);
