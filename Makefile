# Hextra theme development.
#
# Every target is self-documenting: a `## comment` after a target name shows up
# in `make help`. Run `make` on its own to see the list.
#
# Two things about this repo that trip people up, both handled below:
#   1. node_modules is bind-mounted between host and devcontainer and can only
#      hold one platform's native binaries. `make reset` fixes the fallout.
#   2. Tailwind tree-shakes from docs/hugo_stats.json, so that file must be
#      regenerated before compiling CSS or your classes get stripped.

.DEFAULT_GOAL := help
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

# ---------------------------------------------------------------- configuration

PORT        ?= 1313
# The preview service (goStatic) declared in .devcontainer/docker-compose.yml.
# Production output is built with an absolute baseURL, so this must match the
# forwarded port or every link on the previewed site breaks.
PREVIEW_URL ?= http://localhost:8043/
# The preview container as reached from where tests run: inside the
# devcontainer that's the compose service name (localhost:8043 only exists on
# the host, via forwardPorts). On a host checkout, override:
#   make test-preview PREVIEW_TEST_URL=http://localhost:8043
PREVIEW_TEST_URL ?= http://preview:8043
SITE        := docs
STATS       := $(SITE)/hugo_stats.json
CSS_OUT     := assets/css/compiled/main.css
UPSTREAM    ?= upstream-main

# `stats` runs Hugo with --quiet so a routine rebuild does not scroll the
# terminal. The cost is that a render error is swallowed and the target just
# exits non-zero. Set V=1 on any target to get Hugo's full output back:
#   make preview V=1
QUIET := $(if $(V),,--quiet)

# Colours, but only when stdout is a TTY (keeps CI logs clean).
ifneq (,$(findstring xterm,$(TERM)))
  BOLD  := $(shell tput bold)
  DIM   := $(shell tput dim)
  RED   := $(shell tput setaf 1)
  GREEN := $(shell tput setaf 2)
  YELLOW:= $(shell tput setaf 3)
  BLUE  := $(shell tput setaf 4)
  RESET := $(shell tput sgr0)
endif

# Message helpers. Used as `@$(SAY) "text"` rather than $(call ...) so that
# commas inside messages don't get parsed as extra arguments.
SAY  := printf "$(BLUE)==>$(RESET) $(BOLD)%s$(RESET)\n"
OK   := printf "$(GREEN)  ok$(RESET) %s\n"
WARN := printf "$(YELLOW)  !!$(RESET) %s\n"

# ----------------------------------------------------------------------- help

.PHONY: help
help: ## Show this help
	@printf "\n$(BOLD)Hextra theme$(RESET)  $(DIM)make <target>$(RESET)\n\n"
	@awk 'BEGIN {FS = ":.*?## "} \
		/^# --- / { next } \
		/^[a-zA-Z0-9_-]+:.*?## / { printf "  $(GREEN)%-16s$(RESET) %s\n", $$1, $$2 } \
		/^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0, 5) }' $(MAKEFILE_LIST)
	@printf "\n$(DIM)Dev server: port $(PORT).  Preview: $(PREVIEW_URL) (always-on container).$(RESET)\n"
	@printf "$(DIM)Override like: make dev PORT=1314$(RESET)\n"
	@printf "$(DIM)Add V=1 for full Hugo output when a build fails: make preview V=1$(RESET)\n\n"

##@ Setup

.PHONY: deps
deps: node_modules ## Install npm dependencies (skips if already current)

node_modules: package-lock.json
	@$(SAY) "Installing npm dependencies"
	@npm install
	@touch node_modules
	@$(OK) "dependencies installed"

.PHONY: reset
reset: ## Wipe and reinstall node_modules (fixes host/devcontainer binary clashes)
	@$(SAY) "Resetting node_modules"
	@$(WARN) "node_modules is shared between your host and the devcontainer."
	@$(WARN) "Only one platform's native binaries (lightningcss) can exist at a time,"
	@$(WARN) "so switching between them needs a clean reinstall. Doing that now."
	@rm -rf node_modules
	@npm install
	@$(OK) "reinstalled for $$(uname -s)/$$(uname -m)"

.PHONY: doctor
doctor: ## Check the toolchain and diagnose common breakage
	@$(SAY) "Environment"
	@printf "  %-14s %s\n" "platform" "$$(uname -s)/$$(uname -m)"
	@if command -v hugo >/dev/null 2>&1; then \
		printf "  %-14s %s\n" "hugo" "$$(hugo version | head -1)"; \
	else \
		printf "  %-14s $(YELLOW)%s$(RESET)\n" "hugo" "not installed - open this repo in the devcontainer"; \
	fi
	@printf "  %-14s %s\n" "node" "$$(node --version 2>/dev/null || echo MISSING)"
	@printf "  %-14s %s\n" "npm" "$$(npm --version 2>/dev/null || echo MISSING)"
	@printf "  %-14s %s\n" "hugo required" "$$(sed -n 's/^min_version *= *"\(.*\)"/\1/p' theme.toml)"
	@echo
	@$(SAY) "Native binaries"
	@if [ ! -d node_modules ]; then \
		printf "  $(YELLOW)node_modules missing$(RESET) - run: make deps\n"; \
	else \
		found=$$(ls -d node_modules/lightningcss-* 2>/dev/null | sed 's|.*lightningcss-||' | tr '\n' ' '); \
		printf "  %-14s %s\n" "lightningcss" "$${found:-none}"; \
		case "$$(uname -s)/$$(uname -m)" in \
			Darwin/arm64) want=darwin-arm64 ;; \
			Darwin/x86_64) want=darwin-x64 ;; \
			Linux/aarch64) want=linux-arm64 ;; \
			Linux/x86_64) want=linux-x64 ;; \
			*) want="" ;; \
		esac; \
		if [ -n "$$want" ] && ! echo "$$found" | grep -q "$$want"; then \
			printf "  $(RED)mismatch$(RESET) - built for another platform. Run: $(BOLD)make reset$(RESET)\n"; \
		else \
			printf "  $(GREEN)ok$(RESET) matches this platform\n"; \
		fi; \
	fi
	@echo
	@$(SAY) "Fork sync"
	@if git rev-parse --verify --quiet $(UPSTREAM) >/dev/null; then \
		printf "  %-14s %s behind, %s ahead\n" "vs $(UPSTREAM)" \
			"$$(git rev-list --count HEAD..$(UPSTREAM))" \
			"$$(git rev-list --count $(UPSTREAM)..HEAD)"; \
	else \
		printf "  $(YELLOW)no '$(UPSTREAM)' branch$(RESET) - run: make sync-setup\n"; \
	fi

##@ Develop

.PHONY: dev
dev: deps ## Start the dev server with theme reloading (writes hugo_stats.json)
	@$(SAY) "Serving $(SITE) on http://localhost:$(PORT)"
	@$(WARN) "Safari caches the dev server's uncached 301s and serves blank pages."
	@$(WARN) "Develop > Disable Caches, or use Chrome."
	@hugo server --logLevel=debug --config=hugo.yaml,../dev.toml --environment=theme \
		--source=$(SITE) --themesDir=../.. -D -F --port $(PORT)

.PHONY: serve
serve: deps ## Start the dev server without the theme pipeline (faster, no stats)
	@$(SAY) "Serving $(SITE) on http://localhost:$(PORT)"
	@hugo server --source=$(SITE) --themesDir=../.. --disableFastRender -D --port $(PORT)

.PHONY: stats
stats: deps ## Regenerate docs/hugo_stats.json (what Tailwind tree-shakes from)
	@$(SAY) "Regenerating $(STATS)"
	@hugo $(QUIET) --config=hugo.yaml,../dev.toml --themesDir=../.. --source=$(SITE) \
		|| { $(WARN) "hugo failed - re-run with V=1 to see the error: make $(MAKECMDGOALS) V=1"; exit 1; }
	@$(OK) "$(STATS) is current"

.PHONY: css
css: stats ## Compile production CSS (regenerates stats first)
	@$(SAY) "Compiling $(CSS_OUT)"
	@npm run build:css
	@printf "  %s, %s accent/light/dark references\n" \
		"$$(du -h $(CSS_OUT) | cut -f1 | tr -d ' ')" \
		"$$(grep -o 'hextra-accent\|hextra-light\|hextra-dark' $(CSS_OUT) | wc -l | tr -d ' ')"
	@$(OK) "CSS compiled"

.PHONY: css-watch
css-watch: deps ## Recompile CSS on change (run alongside `make dev`)
	@$(SAY) "Watching CSS"
	@npm run watch:css

##@ Content

# All three wrap `hugo new`, so front matter comes from docs/archetypes/ and
# an existing file is refused rather than overwritten. `.md` on NAME is
# optional - it is stripped and re-added so both spellings work. English only;
# translations are copied manually alongside (`.fa.md`, `.ja.md`, ...).

.PHONY: new-blog
new-blog: ## Create a blog post: make new-blog NAME=my-post
	@if [ -z "$(NAME)" ]; then $(WARN) "NAME required, e.g. make new-blog NAME=my-post"; exit 1; fi
	@hugo new --source=$(SITE) --themesDir=../.. "content/blog/$(patsubst %.md,%,$(NAME)).md"
	@$(OK) "created $(SITE)/content/blog/$(patsubst %.md,%,$(NAME)).md (draft)"

.PHONY: new-doc
new-doc: ## Create a docs page: make new-doc NAME=guide/my-page
	@if [ -z "$(NAME)" ]; then $(WARN) "NAME required, e.g. make new-doc NAME=guide/my-page"; exit 1; fi
	@hugo new --source=$(SITE) --themesDir=../.. "content/docs/$(patsubst %.md,%,$(NAME)).md"
	@$(OK) "created $(SITE)/content/docs/$(patsubst %.md,%,$(NAME)).md"

.PHONY: new-doc-auto
new-doc-auto: ## Like new-doc, but weight is auto-set after the section's last page
	@if [ -z "$(NAME)" ]; then $(WARN) "NAME required, e.g. make new-doc-auto NAME=guide/my-page"; exit 1; fi
	@hugo new --source=$(SITE) --themesDir=../.. --kind docs-weighted "content/docs/$(patsubst %.md,%,$(NAME)).md"
	@$(OK) "created $(SITE)/content/docs/$(patsubst %.md,%,$(NAME)).md"

.PHONY: new-page
new-page: ## Create any page under docs/content: make new-page NAME=showcase/thing
	@if [ -z "$(NAME)" ]; then $(WARN) "NAME required, e.g. make new-page NAME=showcase/thing"; exit 1; fi
	@hugo new --source=$(SITE) --themesDir=../.. "content/$(patsubst %.md,%,$(NAME)).md"
	@$(OK) "created $(SITE)/content/$(patsubst %.md,%,$(NAME)).md"

##@ Build

.PHONY: build
build: css ## Production build into docs/public
	@$(SAY) "Building $(SITE)"
	@hugo --gc --minify --themesDir=../.. --source=$(SITE)
	@$(OK) "built to $(SITE)/public"

.PHONY: preview
preview: css ## Build production output for the always-on preview service (includes drafts)
	@$(SAY) "Building $(SITE) with baseURL $(PREVIEW_URL)"
	@hugo --gc --minify --themesDir=../.. --source=$(SITE) --baseURL $(PREVIEW_URL) -D
	@$(OK) "built - open $(PREVIEW_URL)"
	@$(WARN) "Served by the 'preview' container, which is already running."
	@$(WARN) "Re-run this target to update it; no restart needed."

##@ Test

# Every test target builds first. Playwright serves docs/public, so without a
# build it grades whatever happens to be on disk: last week's output, a
# `make preview` build carrying a different baseURL, or nothing at all. The
# specs also assert on production artefacts - search-data checks the index is
# fingerprinted, which only happens under `hugo --minify` - so this must be
# `build` and not `preview`.
#
# Each build rewrites docs/hugo_stats.json. `make clean-stats` drops the churn.

.PHONY: test
test: build ## Build, then run the full Playwright suite
	@npm test

# Runs against the always-on preview container instead of Playwright's own
# `npx serve`, so what you tested is exactly what port 8043 keeps serving
# afterwards. Drafts are included - preview builds with -D - so a failing
# half-written draft fails here, not in `make test`.
.PHONY: test-preview
test-preview: preview ## Rebuild the preview (with drafts), then run the suite against it
	@BASE_URL=$(PREVIEW_TEST_URL) npm test

.PHONY: test-a11y
test-a11y: build ## Build, then run accessibility tests (WCAG 2.2 AA)
	@$(WARN) "Accent colours change contrast ratios - failures here mean tune the shade, not revert."
	@npm run test:a11y

.PHONY: test-mobile
test-mobile: build ## Build, then run mobile menu tests
	@npm run test:mobile-menu

.PHONY: test-build
test-build: build ## Build, then run build-output tests (asciidoc, render-link, search data)
	@npm run test:build

##@ Local CI (act)

# Run the GitHub Actions workflows locally in Docker via nektos/act, with the
# defaults pinned in .actrc. The first run pulls the runner image (~2 GB) and
# downloads Hugo and Playwright inside the container; --reuse keeps the job
# containers so later runs skip all of that.

.PHONY: ci-preflight
ci-preflight:
	@command -v act >/dev/null 2>&1 || { $(WARN) "act is not installed - brew install act (https://nektosact.com)"; exit 1; }
	@docker info >/dev/null 2>&1 || { $(WARN) "Docker is not running - start it and retry"; exit 1; }

.PHONY: ci-dry
ci-dry: ci-preflight ## Validate all workflows without running them (act dry run)
	@$(SAY) "Dry-running all workflows (no containers started)"
	@act pull_request -n
	@act push -n

.PHONY: ci
ci: ci-preflight ## Run all pull-request workflows locally (a11y, build, mobile)
	@$(SAY) "Running pull_request workflows under act"
	@act pull_request

.PHONY: ci-a11y
ci-a11y: ci-preflight ## Run the accessibility workflow locally
	@act pull_request -W .github/workflows/test-accessibility.yml

.PHONY: ci-build
ci-build: ci-preflight ## Run the build-output workflow locally
	@act pull_request -W .github/workflows/test-build.yml

.PHONY: ci-mobile
ci-mobile: ci-preflight ## Run the mobile menu workflow locally
	@act pull_request -W .github/workflows/test-mobile-menu.yml

.PHONY: ci-pages
ci-pages: ci-preflight ## Run the Pages build job locally (deploy is GitHub-only)
	@$(SAY) "Running the pages build job (the deploy job needs GitHub's OIDC token and is skipped)"
	@act push -W .github/workflows/pages.yml -j build

##@ Housekeeping

.PHONY: clean
clean: ## Remove build output and Hugo caches
	@$(SAY) "Cleaning build output"
	@rm -rf $(SITE)/public $(SITE)/resources resources public .hugo_build.lock
	@rm -rf playwright-report test-results
	@$(OK) "removed build output, Hugo caches and test reports"

.PHONY: clean-stats
clean-stats: ## Discard hugo_stats.json churn (it is regenerated on every build)
	@$(SAY) "Discarding $(STATS) changes"
	@git checkout -- $(STATS) 2>/dev/null || true
	@$(OK) "$(STATS) restored to HEAD"

.PHONY: clean-all
clean-all: clean ## Everything `clean` does, plus node_modules
	@rm -rf node_modules
	@$(OK) "removed node_modules - run: make deps"

.PHONY: fmt
fmt: deps ## Format the CSS, JS and Markdown Prettier can handle safely
	@$(SAY) "Formatting"
	@npx prettier --write . --log-level warn
	@$(OK) "formatted"
	@$(WARN) "Hugo templates and docs/content are excluded - see .prettierignore."

.PHONY: fmt-check
fmt-check: deps ## Verify formatting without writing (for CI)
	@$(SAY) "Checking formatting"
	@npx prettier --check . --log-level warn
	@$(OK) "formatting is current"

##@ Fork sync

.PHONY: sync-setup
sync-setup: ## Add the upstream remote and the fast-forward-only mirror branch
	@$(SAY) "Wiring upstream"
	@git remote get-url upstream >/dev/null 2>&1 || \
		git remote add upstream https://github.com/imfing/hextra
	@git fetch upstream --tags
	@git rev-parse --verify --quiet $(UPSTREAM) >/dev/null || \
		git branch $(UPSTREAM) upstream/main
	@$(OK) "'upstream' remote and '$(UPSTREAM)' branch ready"
	@$(WARN) "Never commit to $(UPSTREAM) - it is a fast-forward-only mirror."

.PHONY: sync-status
sync-status: ## Show how far this fork has drifted from upstream
	@$(SAY) "Fork status"
	@git fetch upstream --tags --quiet 2>/dev/null || true
	@printf "  %-18s %s\n" "branch" "$$(git branch --show-current)"
	@printf "  %-18s %s\n" "behind upstream" "$$(git rev-list --count HEAD..upstream/main)"
	@printf "  %-18s %s\n" "ahead of upstream" "$$(git rev-list --count upstream/main..HEAD)"
	@printf "  %-18s %s\n" "latest upstream tag" "$$(git describe --tags --abbrev=0 upstream/main 2>/dev/null || echo unknown)"
	@echo
	@$(SAY) "Fork-owned files (expect these to conflict on every sync)"
	@printf "  %s\n" \
		"assets/css/styles.css        accent/light/dark palette" \
		"assets/css/fonts.css         Google Fonts (fork-only)" \
		"layouts/_partials/google-fonts.html  (fork-only)" \
		"assets/css/components/*.css  accent theming" \
		"layouts/_partials/*.html     accent theming" \
		"static/icons/                favicon reorg" \
		".devcontainer/               compose setup, upstream uses a plain image" \
		"Makefile                     fork-only"
	@echo
	@$(WARN) "Sync one upstream release tag at a time, not all at once."
	@$(WARN) "Regenerate rather than merge: $(CSS_OUT) and $(STATS)."
