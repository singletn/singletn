YARN := yarn
NPM := npm
NPX := npx

.PHONY: deps
deps:
	${YARN} lerna bootstrap

.PHONY: bump/patch
bump/patch:
	${YARN} lerna version patch

.PHONY: bump/minor
bump/minor:
	${YARN} lerna version minor

.PHONY: bump/major
bump/major:
	${YARN} lerna version major

.PHONY: test
test:
	${YARN} jest

.PHONY: test/watch
test/watch:
	${YARN} jest --watch

.PHONY: test/coverage
test/coverage:
	${YARN} jest --coverage

.PHONY: build
build:
	cd packages/core && $(YARN) build
	cd packages/local-storage && $(YARN) build
	cd packages/indexeddb && $(YARN) build
	cd packages/react-singletn && $(YARN) build

.PHONY: publish
publish:
	${MAKE} build
	cd packages/core && $(NPM) publish
	cd packages/local-storage && $(NPM) publish
	cd packages/indexeddb && $(NPM) publish
	cd packages/react-singletn && $(NPM) publish
