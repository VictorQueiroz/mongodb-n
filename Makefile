tdd:
	./node_modules/.bin/mocha test/ --recursive --watch --require babel-register --bail

test:
	./node_modules/.bin/mocha test/ --recursive --require babel-register 

release: test
	./node_modules/.bin/babel src/ -d lib

.PHONY: test tdd release
