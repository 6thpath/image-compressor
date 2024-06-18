install:
	yarn install
	yarn add sharp --ignore-engines --exact

compress:
	node index.js

clean:
	yarn rimraf output/*

# alias
i: install
c: compress
r: clean