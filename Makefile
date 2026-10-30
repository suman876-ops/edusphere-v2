# EduSphere site — build, check, serve, package.
#
#   make          # build + check
#   make serve    # http://localhost:8080
#   make zip      # dist/edusphere-site.zip
#   make deploy   # commit and push, GitHub Pages rebuilds itself

SHELL := /bin/bash
PYTHON ?= python3

.PHONY: all build check serve zip deploy clean

all: build check

build:
	$(PYTHON) tools/build.py

check:
	$(PYTHON) tools/build.py --check

serve:
	bash tools/serve.sh

zip: build
	mkdir -p dist
	rm -f dist/edusphere-site.zip
	cd .. && zip -qr site/dist/edusphere-site.zip site \
		-x 'site/dist/*' -x '*/.DS_Store'
	@echo "dist/edusphere-site.zip"

deploy:
	git add -A
	git commit -m "chore: rebuild site" || true
	git push

clean:
	rm -rf dist
