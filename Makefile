.PHONY: install test lint coverage clean

install:
	pip install -e .

upgrade:
	pip install --upgrade -r requirements.txt

test:
	echo "No tests configured yet."

lint:
	echo "No linting configured yet."

coverage:
	echo "No coverage configured yet."

clean:
	rm -rf build/ dist/ *.egg-info/
	find . -name '*.pyc' -delete
	find . -name '__pycache__' -type d -exec rm -rf {} +
