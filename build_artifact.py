"""Builds artifact.html: a self-contained copy of index.html with photos inlined (artifact pages block outside images)."""
import re, base64, json, urllib.request
src = open("index.html").read()
ids = sorted(set(re.findall(r"photo-[0-9a-f]+-[0-9a-f]+", src)))
imgs = {}
for i in ids:
    url = f"https://images.unsplash.com/{i}?auto=format&fit=crop&w=1100&q=62&fm=jpg"
    data = urllib.request.urlopen(url, timeout=30).read()
    imgs[i] = "data:image/jpeg;base64," + base64.b64encode(data).decode()
out = re.sub(r'https://images\.unsplash\.com/(photo-[0-9a-f]+-[0-9a-f]+)\?[^"\s]*', lambda m: imgs[m.group(1)], src)
out = re.sub(r'https://images\.unsplash\.com/\$\{(\w+)\.img\}\?[^"`\s]*', r'${IMG[\1.img]}', out)
out = out.replace("<script>\n/* ===== EDIT", "<script>const IMG=" + json.dumps(imgs) + ";</script>\n<script>\n/* ===== EDIT", 1)
# forms can't reach outside servers from inside an artifact; submitting just unlocks/confirms
out = out.replace("<script>const IMG=", "<script>window.PREVIEW_ONLY=true;const IMG=", 1)
for pat in [r"<!doctype html>\s*", r"<html[^>]*>\s*", r"</html>\s*", r"<head>\s*", r"</head>\s*", r"<body>\s*", r"</body>\s*",
            r'<meta charset="utf-8">\s*', r'<meta name="viewport"[^>]*>\s*']:
    out = re.sub(pat, "", out, count=1, flags=re.I)
assert "images.unsplash.com" not in out, "leftover remote image"
open("artifact.html", "w").write(out)
print(len(ids), "images,", round(len(out)/1e6, 2), "MB")
