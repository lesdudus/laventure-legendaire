"""Assemble les sources de src/ en un seul fichier HTML jouable.

Usage : python tools/build.py [sortie.html]
Par défaut, écrit index.html à la racine du projet.
Écrit aussi tools/check.mjs (code JS seul) pour node --check et ESLint.
"""
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
order = [
    '01-core.js', '02a-builder.js', '02b-house.js', '02c-north.js', '02d-south.js', '02e-garden.js', '02f-eggs.js', '02g-base.js', '02h-castle.js', '02i-bbq.js',
    '03-physics.js', '04-items.js', '05-models.js', '06a-nav.js', '06b-humans.js', '06c-animals.js',
    '07-missions.js', '08-ui.js', '09a-game.js', '09b-player.js', '09c-actions.js', '09f-events.js', '09e-eggs.js', '09g-style.js', '09h-features.js', '09d-systems.js',
]
js = '\n'.join((src / f).read_text(encoding='utf-8-sig') for f in order)
shell = (src / '00-shell.html').read_text(encoding='utf-8-sig')
assert '/*__GAME__*/' in shell
(root / 'tools' / 'check.mjs').write_text("import * as THREE from 'three';\n" + js, encoding='utf-8')
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'index.html'
out.write_text(shell.replace('/*__GAME__*/', js), encoding='utf-8')
print(f'OK {out} ({out.stat().st_size // 1024} Ko, {js.count(chr(10)) + 1} lignes JS)')
