#!/usr/bin/env python3
"""Openverse : chercher et télécharger des effets sonores sous licence libre.

Aucune dépendance (bibliothèque standard uniquement), aucune clé requise pour les recherches de base.

  python openverse.py search "whoosh" [--n 10] [--length short] [--source freesound] [--json]
  python openverse.py get ID [ID ...] --out DOSSIER
  python openverse.py fetch "soft click" --n 3 --out DOSSIER

Par défaut, seules les licences CC0, PDM (domaine public) et CC BY sont retenues : usage commercial
et modification autorisés, sans contagion de licence. CC BY-SA est exclu car, en licence 4.0, un son
synchronisé à une image fait de la vidéo entière une œuvre adaptée, à partager sous la même licence
(--allow-sa pour l'inclure malgré tout). --any-license lève tout filtre (NC = pas d'usage commercial,
ND = pas de modification : à ne faire qu'en connaissance de cause).

Chaque fichier téléchargé reçoit un fichier .json (métadonnées complètes) et une ligne dans
CREDITS.md du dossier : titre, auteur, licence, lien. Ces crédits sont à reprendre au générique
ou dans la description de la vidéo dès que la licence l'exige (BY, BY-SA).

Variables d'environnement facultatives :
  OPENVERSE_TOKEN  jeton d'accès (limites de requêtes plus hautes), voir api.openverse.org/v1/#tag/auth
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.openverse.org/v1"
UA = "openverse-sfx-skill/1.0 (Claude Code; usage: sound effects for training videos)"
SAFE_LICENSES = "cc0,pdm,by"
DEFAULT_OUT = Path(os.environ.get("OPENVERSE_SFX_DIR", Path.home() / "sons-sfx" / "openverse"))


def _request(url, binary=False, retries=3):
    headers = {"User-Agent": UA}
    token = os.environ.get("OPENVERSE_TOKEN")
    if token and url.startswith(API):
        headers["Authorization"] = f"Bearer {token}"
    last = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as r:
                data = r.read()
                return data if binary else json.loads(data.decode("utf-8"))
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 429:  # limite de requêtes anonymes atteinte
                wait = int(e.headers.get("Retry-After", "10"))
                print(f"openverse: limite de requêtes atteinte, nouvel essai dans {wait} s", file=sys.stderr)
                time.sleep(min(wait, 60))
                continue
            if e.code in (500, 502, 503, 504):
                time.sleep(2 ** attempt)
                continue
            body = e.read().decode("utf-8", "replace")[:300]
            sys.exit(f"openverse: erreur HTTP {e.code} sur {url}\n{body}")
        except urllib.error.URLError as e:
            last = e
            time.sleep(2 ** attempt)
    sys.exit(f"openverse: impossible de joindre {url} ({last}). Réseau ou pare-feu ?")


def search(q, n=10, page=1, license=SAFE_LICENSES, category="sound_effect",
           length=None, source=None, extension=None):
    params = {"q": q, "page_size": max(1, min(n, 20)), "page": page, "mature": "false"}
    if license:
        params["license"] = license
    if category:
        params["category"] = category
    for k, v in (("length", length), ("source", source), ("extension", extension)):
        if v:
            params[k] = v
    return _request(f"{API}/audio/?{urllib.parse.urlencode(params)}")


def detail(audio_id):
    return _request(f"{API}/audio/{urllib.parse.quote(audio_id)}/")


def _licence_label(r):
    lic = (r.get("license") or "").upper()
    ver = r.get("license_version") or ""
    if lic in ("CC0", "PDM"):
        return lic
    return f"CC {lic} {ver}".strip()


def _fmt_dur(ms):
    return f"{ms / 1000:.2f} s" if isinstance(ms, (int, float)) else "? s"


def _slug(text, n=40):
    s = re.sub(r"[^a-zA-Z0-9]+", "-", (text or "son").lower()).strip("-")
    return s[:n] or "son"


def download(r, out: Path):
    out.mkdir(parents=True, exist_ok=True)
    url = r.get("url")
    if not url:
        print(f"  {r.get('id')}: pas d'URL de fichier, ignoré", file=sys.stderr)
        return None
    ext = (r.get("filetype") or Path(urllib.parse.urlparse(url).path).suffix.lstrip(".") or "mp3").lower()
    name = f"{_slug(r.get('title'))}__{r['id'][:8]}.{ext}"
    dest = out / name
    if not dest.exists():
        dest.write_bytes(_request(url, binary=True))
    (out / (name + ".json")).write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")
    credits = out / "CREDITS.md"
    line = (f"- **{r.get('title') or 'Sans titre'}** — {r.get('creator') or 'auteur inconnu'} — "
            f"{_licence_label(r)} ({r.get('license_url') or ''}) — {r.get('foreign_landing_url') or ''} "
            f"— fichier `{name}`\n")
    existing = credits.read_text(encoding="utf-8") if credits.exists() else "# Crédits sons (Openverse)\n\n"
    if f"`{name}`" not in existing:
        credits.write_text(existing + line, encoding="utf-8")
    return dest


def _print_results(data):
    res = data.get("results", [])
    print(f"{data.get('result_count', len(res))} résultats (page {data.get('page', 1)}/{data.get('page_count', '?')})")
    for r in res:
        tags = ", ".join(t.get("name", "") for t in (r.get("tags") or [])[:5])
        print(f"- {r['id']}  {_fmt_dur(r.get('duration'))}  {_licence_label(r):12s} {r.get('source', '')}"
              f"  « {r.get('title', '')} » par {r.get('creator', '?')}")
        if tags:
            print(f"    tags : {tags}")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    def common(sp):
        sp.add_argument("query")
        sp.add_argument("--n", type=int, default=10, help="nombre de résultats (max 20 sans jeton)")
        sp.add_argument("--page", type=int, default=1)
        sp.add_argument("--length", choices=["shortest", "short", "medium", "long"])
        sp.add_argument("--source", help="ex. freesound, wikimedia_audio, jamendo, ccmixter")
        sp.add_argument("--extension", help="ex. wav, mp3, ogg, flac")
        sp.add_argument("--category", default="sound_effect",
                        help="sound_effect (défaut), music, podcast... ; '' pour toutes")
        sp.add_argument("--license", help="liste précise, ex. cc0,by (remplace le filtre par défaut cc0,pdm,by)")
        sp.add_argument("--allow-sa", action="store_true", help="ajoute CC BY-SA (contagion de licence à la vidéo)")
        sp.add_argument("--any-license", action="store_true", help="aucun filtre de licence (NC, ND inclus)")

    s = sub.add_parser("search", help="chercher")
    common(s)
    s.add_argument("--json", action="store_true")
    f = sub.add_parser("fetch", help="chercher puis télécharger les N premiers")
    common(f)
    f.add_argument("--out", type=Path, default=DEFAULT_OUT)
    g = sub.add_parser("get", help="télécharger par identifiant")
    g.add_argument("ids", nargs="+")
    g.add_argument("--out", type=Path, default=DEFAULT_OUT)
    a = p.parse_args()

    if a.cmd in ("search", "fetch"):
        lic = None if a.any_license else (a.license or SAFE_LICENSES + (",by-sa" if a.allow_sa else ""))
        data = search(a.query, a.n, a.page, lic, a.category or None, a.length, a.source, a.extension)
        if a.cmd == "search":
            if a.json:
                print(json.dumps(data, ensure_ascii=False, indent=2))
            else:
                _print_results(data)
            return
        for r in data.get("results", [])[: a.n]:
            d = download(r, a.out)
            if d:
                print(f"téléchargé : {d}  ({_licence_label(r)}, {r.get('creator', '?')})")
    else:
        for i in a.ids:
            d = download(detail(i), a.out)
            if d:
                print(f"téléchargé : {d}")
    if a.cmd in ("fetch", "get"):
        print(f"crédits : {a.out / 'CREDITS.md'}")


if __name__ == "__main__":
    main()
