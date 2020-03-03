let fs = require('fs');

let contents = fs.readFileSync('GAME_MASTER.json', 'utf8');

let allData = JSON.parse(contents);

let outputJSON = (json = {}, fileName = '', jsonSpace = 2) => {
  let fileContent = JSON.stringify(json, null, jsonSpace);
  fs.writeFileSync(fileName, fileContent);
  console.log(`JSON saved as ${fileName}! ( ${fileContent.length / 1000} kb )`);
};

((allData) => {
  let replacePT = (str) => str.replace('POKEMON_TYPE', '$T')
  let _data = allData;
  if (allData.result) {
    allData = allData.itemTemplates;
  }

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
    'durationTurns',
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
    moves: [],
  };
  
  let _moves = _data
  .filter(d => d.moveSettings)
  .sort((a, b) => b.moveSettings.energyDelta - a.moveSettings.energyDelta);

  let _combat_moves = _data
    .filter(d => d.combatMove)
    .sort((a, b) => b.combatMove.energyDelta - a.combatMove.energyDelta);
  
  op.moves = _moves
    .map(m => {
      return {
        templateId: m.templateId,
        type: m.moveSettings.pokemonType,
        mid: m.moveSettings.movementId,
        data: { ...m.moveSettings },
      };
    });
  
  _combat_moves.forEach(cm => {
    let tid = cm.templateId.replace('COMBAT_', '');
    let _m = op.moves.find(m => m.templateId === tid);
    if (_m) {
      _m.pvpData = { ...cm.combatMove };
    } else {
      op.moves.push({
        templateId: tid,
        pvpData: { ...cm.combatMove },
      });
    }
  });

  op.moves.forEach(m => {
    // m.mid = m.moveSettings.movementId;
    delete m.data.movementId;
    delete m.data.pokemonType;
    if (m.pvpData) {
      delete m.pvpData.uniqueId;
      if (m.pvpData.type === m.type) {
        delete m.pvpData.type;
      }
    }
  })
  

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
      _pm.pokemonSettings.stats = {
        a: _pm.pokemonSettings.stats.baseAttack,
        s: _pm.pokemonSettings.stats.baseStamina,
        d: _pm.pokemonSettings.stats.baseDefense,
      };
      _pm.pokemonSettings.heightM = _pm.pokemonSettings.pokedexHeightM;
      _pm.pokemonSettings.weightKg = _pm.pokemonSettings.pokedexWeightKg;
      _pm.data = { ..._pm.pokemonSettings };
      _pm.data.pid = _pm.data.pokemonId;
      _pm.data.fid = _pm.data.familyId.replace('FAMILY_', '$F_');
      _pm.data.types = [_pm.data.type, _pm.data.type2].filter(Boolean);
      if (_pm.data.gender) {
        _pm.data.gender = Object.keys(_pm.data.gender).reduce((all, i) => {
          all[i.replace('Percent', '')] = _pm.data.gender[i];
          return all;
        }, {});
      }
      delete _pm.data.type;
      delete _pm.data.type2;
      delete _pm.data.pokemonId;
      delete _pm.data.familyId;
      delete _pm.data.pokedexHeightM;
      delete _pm.data.pokedexWeightKg;
      delete _pm.pokemonSettings;
      return _pm;
    });

    return o;
  });


  op.types = op.moves.reduce((all, m) => {
    let _type = m.type;
    if (all.indexOf(_type) === -1) {
      all.push(_type);
    }
    return all;
  }, [])
  .sort();

  outputJSON(op, 'pm-index.json', 2);
  outputJSON(op, 'pm-index.min.json', null);
})(allData);
