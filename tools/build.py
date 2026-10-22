"""Build deterministic offline and hosted variants without runtime CDNs."""
import base64,json,re,zipfile,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SCRIPTS=['pieces.js','ai.js','content.js','storage.js','archive.js','planner.js','lessons.js','exercises.js','badges.js','app.js','bootstrap.js']
def build():
 out=ROOT/'dist';out.mkdir(exist_ok=True)
 template=(ROOT/'src/index.html').read_text()
 template=re.sub(r'<link rel="stylesheet"[^>]*>','<style>\n'+(ROOT/'src/style.css').read_text()+'\n</style>',template)
 template=re.sub(r'<script src="[^"]*"></script>','',template)
 scripts=[(out/'chess.js').read_text()]+[(ROOT/'src'/name).read_text() for name in SCRIPTS if (ROOT/'src'/name).exists()]
 html=template.replace('</body>','\n'+''.join('<script>\n'+s.replace('</script','<\\/script')+'\n</script>\n' for s in scripts)+'</body>')
 (out/'index.html').write_text(html)
 with zipfile.ZipFile(out/'xiaoba-offline.zip','w',zipfile.ZIP_DEFLATED) as z:
  for name in ['index.html','chess.js','README.txt','THIRD-PARTY-NOTICES.txt','LICHESS-COPYING.md','GPL-2.0.txt']:
   info=zipfile.ZipInfo(name,(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,(out/name).read_bytes())
 hosted=html
 for name,mime in [('README.txt','text/plain;charset=utf-8'),('xiaoba-offline.zip','application/zip')]:
  hosted=hosted.replace('href="'+name+'"','href="data:'+mime+';base64,'+base64.b64encode((out/name).read_bytes()).decode()+'"')
 release=ROOT/'releases';release.mkdir(exist_ok=True)
 (release/'axureshow-inline.html').write_text(hosted)
 manifest={'sha256':hashlib.sha256(hosted.encode()).hexdigest(),'bytes':len(hosted.encode()),'runtimeExternalAssets':0}
 (release/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 print(json.dumps(manifest))
if __name__=='__main__':build()
