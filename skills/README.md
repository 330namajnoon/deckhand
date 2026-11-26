# skills/

Los skills de esta carpeta no se versionan en claro (gitignored): se publican
cifrados en `../private.enc` y el plugin los descifra aquí con la contraseña
del panel de ajustes. Tras crear o cambiar uno, ejecuta `yarn encrypt:private`
y versiona `private.enc`. Este README es lo único público de la carpeta.

Skills de Claude Code útiles para trabajar en este proyecto, expuestos vía MCP
(tools `list_skills` / `get_skill`, ver `mcpServer/tools/`) para que un agente
que se conecta a deckhand pueda descubrirlos e instalarlos.

Cada skill es una carpeta con un `SKILL.md`, el mismo formato que un skill
normal de Claude Code, y puede traer además cualquier script/referencia/asset
que necesite junto al `SKILL.md`:

```
skills/
  <nombre-del-skill>/
    SKILL.md
    scripts/...      (opcional)
    references/...   (opcional)
```

`SKILL.md` empieza con frontmatter YAML (`name`, `description`) seguido del
cuerpo con las instrucciones del skill:

```markdown
---
name: nombre-del-skill
description: Una línea que dice qué hace y cuándo usarlo.
---

Instrucciones del skill...
```

`get_skill` devuelve la carpeta `<nombre-del-skill>/` entera comprimida en un
`.zip` (no solo el `SKILL.md`), pensado para descomprimirse directamente como
`.claude/skills/<nombre-del-skill>/` de quien lo instale.
