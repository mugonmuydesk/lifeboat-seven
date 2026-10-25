from pathlib import Path
root = Path(__file__).resolve().parent
shell = (root / 'src/shell.html').read_text()
engine = (root / 'vendor/three.min.js').read_text()
voice = 'const VOICE_RECORDINGS=' + (root / 'src/recordings.json').read_text() + ';\n' + (root / 'src/voice.js').read_text()
world = (root / 'src/world.js').read_text()
game = (root / 'src/game.js').read_text()
voyage = (root / 'src/voyage.js').read_text()
html = shell.replace('<!--ENGINE-->', '<script>' + engine + '</script>')
html += voice + '\n' + world + '\n' + game + '\n' + voyage + '\n</script></body></html>\n'
(root / 'index.html').write_text(html)
print(f'Built {root / "index.html"} ({len(html.encode()):,} bytes)')
