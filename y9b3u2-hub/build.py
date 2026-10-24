# Build index.html (single file, images inlined) from template.html + img/
import base64, pathlib
D = pathlib.Path(__file__).parent
html = (D / "template.html").read_text(encoding="utf-8")
for key, name in [("__C0__", "c0"), ("__C1__", "c1"), ("__C2__", "c2"), ("__C3__", "c3"), ("__C4__", "c4"), ("__C5__", "c5")]:
    b = base64.b64encode((D / "img" / f"{name}.webp").read_bytes()).decode()
    html = html.replace(key, "data:image/webp;base64," + b)
import json
enc = lambda n: base64.b64encode((D / "sfx" / f"{n}.mp3").read_bytes()).decode()
sfx = enc("wood-tick0")  # the single wooden-ratchet click the teacher chose
html = html.replace("__SFX__", json.dumps(sfx))
(D / "index.html").write_text(html, encoding="utf-8")
print(len(html))
