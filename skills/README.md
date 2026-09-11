# Skills

Agent-facing skill packages that ship with the theme.

| Skill                | Covers                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`hextra/`](hextra/) | Authoring a site with the Hextra theme — shortcodes, front matter, `hugo.yaml`, the blog, Markdown features. |

These are for agents working on a site that _uses_ the theme. For agents working on the theme itself, see [`AGENTS.md`](../AGENTS.md) at the repository root.

## Installing

Each skill directory is self-contained — nothing inside it references a path outside itself — so installing is a directory copy. Put it wherever your agent looks for skills:

| Destination                | Scope                                                    |
| -------------------------- | -------------------------------------------------------- |
| `.claude/skills/hextra/`   | This project only. Commit it and the whole team gets it. |
| `~/.claude/skills/hextra/` | Every project you work on.                               |

The copy must land so that `SKILL.md` sits at `<destination>/hextra/SKILL.md`.

### From a clone of the theme

```bash
cp -r skills/hextra ~/.claude/skills/
```

### From a site using the theme

Where the files live depends on how the theme was installed.

**Git submodule or `themesDir`** — the theme is a directory in your site:

```bash
cp -r themes/hextra/skills/hextra .claude/skills/
```

**Hugo module** — the theme is in the read-only, version-pinned Go module cache, so vendor it first and copy out of `_vendor/`:

```bash
hugo mod vendor
cp -r _vendor/github.com/imfing/hextra/skills/hextra .claude/skills/
```

### Without a local copy of the theme

```bash
mkdir -p .claude/skills
curl -sL https://github.com/smit-io/hextra/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=2 -C .claude/skills 'hextra-main/skills/hextra'
```

### Other agents

The package is plain Markdown with YAML front matter — no executable code, no agent-specific format. An agent that does not scan a skills directory can simply be pointed at `skills/hextra/SKILL.md`, which links to every reference file. Adding that path to an `AGENTS.md` or equivalent works too.

### Verifying

```bash
ls .claude/skills/hextra/SKILL.md .claude/skills/hextra/references/
```

In Claude Code, `/skills` lists what was picked up; the skill announces itself as `hextra`.

## Generated files

`skills/hextra/references/shortcodes.md` and `icons.md` are generated from the theme's own source, so the documented syntax cannot drift from what the shortcodes accept.

- **`layouts/\_shortcodes/**/\*.html`is the authority.** Parameter names, defaults, required-ness, paired vs self-closing, and most descriptions come from the templates and their`@param`/`@example` doc comments.
- **`.vscode/hextra.code-snippets` is secondary**, supplying enum choices and complete copy-paste examples, plus the front matter and code-fence entries that are not shortcodes at all.
- **`data/icons.yaml`** supplies the icon list.

The generator also cross-checks the two shortcode sources and reports any snippet that names a parameter no template reads, or a template parameter with no `@param`.

```bash
npm run build:skill                     # regenerate
node scripts/build-skill.mjs --check    # fail if stale (runs in CI)
node scripts/build-skill.mjs --strict   # also fail on a source mismatch
```

Edit the templates, snippets, or icon data — never the generated Markdown. Everything else under `skills/hextra/` is hand-written and edited directly.

Mismatches are printed on every run but do not fail the build, because the theme currently has known gaps (`asciinema` has no doc comment; `tabs` does not document its deprecated `items` and `defaultIndex`). Pass `--strict` to treat them as errors once those are closed.
