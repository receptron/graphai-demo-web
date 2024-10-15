# Makefile for GraphAI demo
#
## install: Initialize and start firebase
.PHONY: install
install:
	brew install vite
	yarn global add firebase-tools
	yarn install
	cd functions && yarn install

## firebase: Install into firebase
.PHONY: firebase
	@echo in firebase console, add project , choose web, copy config to src/config/project.ts
	open https://firebase.google.com

## serve: run locally
.PHONY: serve
serve: install
	yarn run serve
