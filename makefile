install:
	yarn install
	yarn add sharp --ignore-engines --exact

compress:
	yarn ts-node index.ts

clean:
	yarn rimraf output/*

# alias
i: install
c: compress
r: clean