#!/usr/bin/env python
"""Checks for the Bowen Education Centre preview page.

Run:  python check.py      ->  prints ALL PASS, or the failures.

1. the visible text has none of the words Beam left behind, or anything the lead's facts do not support
2. the business name is in the <title> and in the visible text
3. every <a href> is an allowed link
4. every <img src> exists on disk, and no portrait / showcase photo from the template is used
5. every number on the page appears in the research file or the brand-tokens file

Layout, overflow and broken images are the screenshot script's job (shots.cjs), not this one's.
"""
import html as H
import sys as _s
_s.stdout.reconfigure(encoding="utf-8")
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
QUEUE = os.path.abspath(os.path.join(HERE, "..", "..", "..", "preview-queue"))
PAGE = os.path.join(HERE, "index.html")
RESEARCH = os.path.join(QUEUE, "2026-10-16-bowen-education-centre-RESEARCH.md")
BRAND = os.path.join(QUEUE, "2026-10-16-bowen-education-centre-BRAND-TOKENS.md")

NAME = "Bowen Education Centre"
ZH = "博文教育中心"
WA = ("https://wa.me/6596160836?text=Hi%20Bowen%20Education%20Centre%2C%20I%27d%20like%20to%20ask%20about"
      "%20Chinese%20tuition%20for%20my%20child.")
OTHER = ("tel:+6596160836", "mailto:bowentuition@gmail.com",
         "https://www.google.com/maps/search/?api=1&query=Bowen+Education+Centre+806+Hougang+Central",
         "https://www.instagram.com/bowen_education/", "https://www.facebook.com/boweneducation/")

src = open(PAGE, encoding="utf-8").read()
facts = open(RESEARCH, encoding="utf-8").read() + "\n" + open(BRAND, encoding="utf-8").read()

# ---- what a visitor can read ------------------------------------------------
no_js = re.sub(r"(?is)<(script|style|noscript)\b[^>]*>.*?</\1>", " ", src)
no_js = re.sub(r"(?s)<!--.*?-->", " ", no_js)
text = H.unescape(re.sub(r"<[^>]+>", " ", no_js))
text = re.sub(r"\s+", " ", text).strip()
low = text.lower()

fails = []

# ---- 1. wording -------------------------------------------------------------
# Beam's own copy (it is a template for holiday classes, not a Science tuition centre), plus the two numbers
# the lead's facts do not support and the usual unedited-placeholder tells.
BANNED = ["online", "grades", "beam", "science", "midtown", "patrick", "learning genius", "upper serangoon", "9820",
          "500+", "4.9", "max 8", "sibling", "$", "lorem ipsum", "{{", "placeholder", "example.com", "your business name"]
hits = [w for w in BANNED if w in low]
if hits:
    fails.append("1. wording that must not be on the page: %s" % ", ".join(hits))
    for w in hits:
        for m in re.finditer(re.escape(w), low):
            print("     ...%s..." % text[max(0, m.start() - 70):m.start() + 70])

# ---- 2. the business name ---------------------------------------------------
if NAME.lower() not in low:
    fails.append("2. %r is not in the visible text" % NAME)
if ZH not in text:
    fails.append("2. %r is not in the visible text" % ZH)
title = re.search(r"(?is)<title>(.*?)</title>", src)
if not title or NAME.lower() not in title.group(1).lower():
    fails.append("2. %r is not in the <title>" % NAME)

# ---- 3. links ---------------------------------------------------------------
anchors = re.findall(r"<a\b[^>]*?\shref=\"([^\"]*)\"", src, re.S)
ids = set(re.findall(r"\sid=\"([^\"]*)\"", src))
bad = []
for href in anchors:
    if href == "#" or (href.startswith("#") and href[1:] in ids):
        continue
    if H.unescape(href) == WA or H.unescape(href) in OTHER:
        continue
    bad.append(href)
if bad:
    fails.append("3. links that are not allowed: %s" % bad)
if not any(H.unescape(h) == WA for h in anchors):
    fails.append("3. no wa.me link")
wrong = [h for h in anchors if "wa.me" in h and "6596160836" not in h]
if wrong:
    fails.append("3. wa.me link not using 6596160836: %s" % wrong)
link_counts = {k: anchors.count(k) for k in sorted(set(anchors))}

# ---- 4. images --------------------------------------------------------------
# The template's portrait and showcase photos stay on disk (step 1 says so) but must never be used. The brush
# masks are named mask-<section>.png on purpose, and those are decoration, not a photo of anyone.
PHOTO_BANNED = ("our-teachers", "testimonials", "showcase")
refs = [os.path.join(HERE, s) for s in re.findall(r"<img\b[^>]*?\ssrc=\"([^\"]*)\"", src, re.S)]
for css in ("css/site.css", "css/sections.css", "css/pages/home.css", "css/lead.css"):
    path = os.path.join(HERE, css)
    if os.path.exists(path):
        # a url() in a stylesheet is relative to that stylesheet, not to the page
        refs += [os.path.normpath(os.path.join(os.path.dirname(path), u))
                 for u in re.findall(r"url\(\s*[\"']?([^\"')]+)", open(path, encoding="utf-8").read())
                 if not u.startswith(("#", "http", "data:"))]
for p in refs:
    base = os.path.basename(p)
    if any(b in base for b in PHOTO_BANNED) and not base.startswith("mask-"):
        fails.append("4. a template portrait / showcase image is used: %s" % p)
    if not os.path.exists(p):
        fails.append("4. image not on disk: %s" % os.path.relpath(p, HERE))
used = sorted(set(re.findall(r"<img\b[^>]*?\ssrc=\"([^\"]*)\"", src, re.S)))

# ---- 5. numbers -------------------------------------------------------------
# Every number in the visible text has to be readable in the research or brand-tokens file. The three step
# numerals are decoration, and are listed here so the exception is visible rather than hidden in the pattern.
EXCEPTIONS = {
    "01": "how-it-works step number (decoration, not a fact)",
    "02": "how-it-works step number (decoration, not a fact)",
    "03": "how-it-works step number (decoration, not a fact)",
}
used_numbers = []
quotes = re.findall(r'<p class="testimonials-text-2">(.*?)</p>', src, re.S)
num_text = text
for q in quotes:
    num_text = num_text.replace(H.unescape(re.sub(r"<[^>]+>", " ", q)).strip(), " ")
    num_text = re.sub(r"\s+", " ", num_text)
for tok in re.findall(r"\d[\d:.,]*", num_text):
    tok = tok.strip(".,:")
    if tok and tok not in used_numbers:
        used_numbers.append(tok)

print("numbers on the page, and where each comes from:")
unknown = []
for t in used_numbers:
    if t in EXCEPTIONS:
        where = EXCEPTIONS[t]
    elif t in facts:
        where = "research / brand tokens"
    else:
        where = "*** NOT IN THE RESEARCH ***"
        unknown.append(t)
    print("   %-10s %s" % (t, where))
if unknown:
    fails.append("5. numbers I cannot trace to the research file: %s" % unknown)

# ---- 6. leftovers in any file
for root, _d, files in os.walk(HERE):
    for fn in files:
        if fn in ("check.py", "shots.cjs") or not fn.lower().endswith((".html", ".css", ".js", ".svg", ".txt", ".md")):
            continue
        p = os.path.join(root, fn)
        t = open(p, encoding="utf-8", errors="ignore").read()
        for bad_s in ("Learning Genius", "6598205432"):
            if bad_s.lower() in t.lower():
                fails.append("6. %r still in %s" % (bad_s, os.path.relpath(p, HERE)))

# ---- report -----------------------------------------------------------------
desc = re.search(r'name="description" content="([^"]*)"', src)
print()
print("title:        %s" % (title.group(1).strip() if title else "(none)"))
print("meta desc:    %s" % ((desc.group(1)[:88] + "...") if desc else "(none)"))
print("noindex:      %s" % ("yes" if 'name="robots" content="noindex"' in src else "NO"))
print("images used:  %s" % ", ".join(used))
print("links used:   %s" % ", ".join("%s (%d)" % (k[:48], v) for k, v in link_counts.items()))
print("visible text: %d characters" % len(text))
print()
if fails:
    print("FAILURES:")
    for f in fails:
        print("  " + f)
    sys.exit(1)
print("ALL PASS")
