# Plan de implementación — Spec 048

## Contexto
- `README.md:1` y `frontend/src/App.tsx:84-87` usan «Diagnóstico de Agent Answer» / «Call Center · Análisis»; `frontend/index.html` tiene `<title>frontend</title>` y `lang="en"`.
- `gh repo view`: `analisis-sdd`, privado, admite merge/squash/rebase, `deleteBranchOnMerge: false`.
- Protección de rama: HTTP 403 (requiere GitHub Pro en repos privados).
- `.claude/skills/{nueva-spec,cerrar-spec}/SKILL.md` no mencionan ramas ni PR.

## Pasos
1. **Rama** `chore/048-project-almanaque` + docs `spec/048-spec-project-almanaque/{spec,plan,task}.md`.
2. **Nombre**: README, AGENTS.md, constitution, App.tsx, index.html, `frontend/package.json` + lock.
3. **Reglas**: `docs/github-flow.md`; resumen en AGENTS.md; sección en README.
4. **Hooks**: `.githooks/commit-msg`, `.githooks/pre-push` (ejecutables) + `git config core.hooksPath .githooks`.
5. **Skills**: rama en `/nueva-spec`; commit/PR/merge en `/cerrar-spec`.
6. **Tests**: `backend/test_git_hooks.py`; vitest del encabezado.
7. **Verificación**: `/cerrar-spec 048` → commit → push → PR → squash merge.
8. **Repo**: `gh repo rename almanaque` + ajustes de merge; `git remote -v`; `main` local actualizado.
