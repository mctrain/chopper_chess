#!/usr/bin/env python3
"""Run the repository gates and verify the exact publishable release checksum."""
import argparse,hashlib,json,subprocess
from pathlib import Path

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--repo',type=Path,default=Path.cwd());args=parser.parse_args()
    root=args.repo.resolve()
    if not (root/'AGENTS.md').is_file() or not (root/'tools/build.py').is_file():parser.error('--repo must be the Chopper Chess checkout')
    subprocess.run(['npm','run','check'],cwd=root,check=True)
    payload=(root/'releases/axureshow-inline.html').read_bytes();manifest=json.loads((root/'releases/manifest.json').read_text())
    if hashlib.sha256(payload).hexdigest()!=manifest['sha256'] or len(payload)!=manifest['bytes']:raise SystemExit('Release checksum mismatch; rebuild before publishing')
    if manifest['runtimeExternalAssets']!=0:raise SystemExit('Unexpected runtime external resources')
    print('READY:',manifest['sha256'],len(payload),'bytes. Browser verification and authorized deployment are the next gates.')
if __name__=='__main__':main()
