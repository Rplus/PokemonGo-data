filter = true

url0 = 'https://github.com/pokemongo-dev-contrib/pokemongo-game-master/raw/master/versions/latest/GAME_MASTER.json'
url1 = 'https://raw.githubusercontent.com/pokemongo-dev-contrib/pokemongo-game-master/master/versions/latest/GAME_MASTER.json'
url2 = 'https://github.com/ZeChrales/PogoAssets/raw/master/gamemaster/gamemaster.json'
url3 = 'https://github.com/PokeMiners/game_masters/raw/master/latest/latest.json'


dw-data:
	wget -q --no-check-certificate --no-cache --no-cookies ${url3} -O 'GAME_MASTER.json'

dw0:
	wget -q --no-check-certificate --no-cache --no-cookies ${url0} -O 'GAME_MASTER.json'

dw1:
	wget -q --no-check-certificate --no-cache --no-cookies ${url1} -O 'GAME_MASTER.json'

dw2:
	wget -q --no-check-certificate --no-cache --no-cookies ${url2} -O 'GAME_MASTER.json'

dw3:
	wget -q --no-check-certificate --no-cache --no-cookies ${url3} -O 'GAME_MASTER.json'

gen-data: filter-pm-stats filter-pm-go

filter-pm-stats:
	node filter-pokemon-stats.js filter=${filter}

filter-pm-go:
	node filter-pm-go.js

get-legendary-moves:
	node get-legemdary-moves.js
