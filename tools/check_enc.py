"""Détecte le texte mal encodé (mojibake) dans les sources.

Usage : python tools/check_enc.py [dossier]   (par défaut : src/)
"""
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'src'
markers = ['\u00c3', '\u00e2\u20ac', '\u00f0\u0178']
bad = False
for p in sorted(src.glob('*.js')) + sorted(src.glob('*.html')):
    t = p.read_text(encoding='utf-8-sig')
    n = sum(t.count(m) for m in markers)
    if n:
        bad = True
        print('MOJIBAKE', p.name, n)
print('ALL CLEAN' if not bad else 'PROBLEMS FOUND')
sys.exit(1 if bad else 0)
