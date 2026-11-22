#!/usr/bin/env python3
"""Optional distribution checks; Python standard library only, no app build."""
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
errors = []

def check(condition, message):
    if not condition:
        errors.append(message)

for path in ('package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts'):
    check(not (ROOT / path).exists(), 'Removed toolchain file present: ' + path)
for folder in ('src', 'tools', 'tests', 'vendor'):
    for path in (ROOT / folder).rglob('*'):
        if path.suffix not in ('.js', '.mjs', '.css', '.html'):
            continue
        source = path.read_text()
        if folder != 'vendor' and path.suffix in ('.js', '.mjs'):
            check(not re.search(r"(?:from\s*|import\s*)['\"]node:", source), 'Node import: ' + str(path))
        # Check static import declarations, not examples or strings inside bundled libraries.
        code = re.sub(r'/\*.*?\*/|^\s*//[^\n]*', '', source, flags=re.S | re.M)
        refs = re.findall(r"(?m)^\s*(?:import|export)\s+(?:\{[^}]*\}|[\w$*]+(?:\s+as\s+[\w$]+)?)\s+from\s*['\"]([^'\"]+)['\"]|\bimport\s*\(\s*['\"]([^'\"]+)['\"]", code) if path.suffix in ('.js', '.mjs') else []
        for pair in refs:
            ref = next(x for x in pair if x)
            check(ref.startswith('.'), f'Nonlocal module in {path.relative_to(ROOT)}: {ref}')
            if ref.startswith('.'):
                target = (path.parent / ref).resolve()
                check(target.is_relative_to(ROOT) and target.is_file(), f'Missing module: {path.relative_to(ROOT)} → {ref}')
        if path.suffix == '.css':
            for ref in re.findall(r'url\([\s\"\x27]*([^\)\"\x27\s]+)', source):
                if ref.startswith('data:'):
                    continue
                check(not re.match(r'https?:|//', ref), 'Remote CSS resource: ' + ref)
                check((path.parent / ref).is_file(), 'Missing CSS resource: ' + ref)

manifest = json.loads((ROOT / 'vendor/manifest.json').read_text())
declared = set()
for entry in manifest['files']:
    path = ROOT / entry['path']
    declared.add(entry['path'])
    check(path.is_file(), 'Missing vendor file: ' + entry['path'])
    if path.is_file():
        body = path.read_bytes()
        check(len(body) == entry['bytes'], 'Vendor size: ' + entry['path'])
        check(hashlib.sha256(body).hexdigest() == entry['sha256'], 'Vendor hash: ' + entry['path'])
actual = {str(p.relative_to(ROOT)) for p in (ROOT / 'vendor').rglob('*') if p.is_file() and p.name not in ('manifest.json', 'README.md')}
check(actual == declared, 'Vendor inventory differs from delivered files')
for package in manifest['packages']:
    for license_file in package['licenseFiles']:
        check((ROOT / license_file).is_file(), 'Missing license: ' + license_file)
for name in ('index.html', 'authoring.html'):
    for ref in re.findall(r'(?:src|href)=["\x27]([^"\x27]+)', (ROOT / name).read_text()):
        if ref.startswith('#'):
            continue
        check((ROOT / ref).is_file(), 'Missing entrypoint resource: ' + ref)
catalog = json.loads((ROOT / 'demo/content/catalog.json').read_text())
for entry in catalog['files']:
    body = (ROOT / 'demo/content' / entry['path']).read_bytes()
    check(len(body) == entry['bytes'] and hashlib.sha256(body).hexdigest() == entry['sha256'], 'Demo integrity: ' + entry['path'])
config = json.loads((ROOT / 'atlas.config.json').read_text())
check(hashlib.sha256((ROOT / 'demo/content/catalog.json').read_bytes()).hexdigest() == config['demo']['expectedCatalogSha256'], 'Demo catalogue digest')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'Static checks passed: local module graph, {len(declared)} vendor files, licenses and {len(catalog["files"])} demo payloads. Browser tests: open tests/index.html.')
