filter = true

get-data:
# 	wget -q https://raw.githubusercontent.com/pokemongo-dev-contrib/pokemongo-game-master/master/versions/latest/GAME_MASTER.json -O GAME_MASTER.json
	wget -q --no-check-certificate --no-cache --no-cookies 'https://github.com/ZeChrales/PogoAssets/raw/master/gamemaster/gamemaster.json' -O 'GAME_MASTER.json'

filter-pm-stats:
	node filter-pokemon-stats.js filter=${filter}
