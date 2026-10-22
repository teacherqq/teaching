# Build index.html (single file, images inlined) from template.html + img/
import base64, pathlib
D = pathlib.Path(__file__).parent
html = (D / "template.html").read_text(encoding="utf-8")
for key, name in [("__C0__", "c0"), ("__C1__", "c1"), ("__C2__", "c2")]:
    b = base64.b64encode((D / "img" / f"{name}.webp").read_bytes()).decode()
    html = html.replace(key, "data:image/webp;base64," + b)
(D / "index.html").write_text(html, encoding="utf-8")
print(len(html))
