.PHONY: lint test test-int sim
lint:
	genvm-lint check contracts/kept_v02.py
test:
	python -m pytest tests/direct -q
test-int:
	gltest tests/integration -v -s
sim:
	glsim --port 4000 --validators 5
