#!/usr/bin/env python3
"""Sound design des vidéos Le Break (30 s et 45 s), entièrement synthétisé.

Groove de percussions (djembé, shaker, cloche), basse et balafon à 120 BPM,
plus des bruitages calés sur les mêmes repères que l'image (src/lebreak/timing.json).
Sortie : public/lebreak/son-30s.mp3 et son-45s.mp3, normalisés à -16 LUFS.

Usage : python3 scripts/lebreak_audio.py   (numpy + ffmpeg)
"""
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

RACINE = Path(__file__).resolve().parent.parent
T = json.loads((RACINE / 'src/lebreak/timing.json').read_text())
C = T['cues']
SR = 44100
TEMPS = 60 / T['bpm']  # durée d'un temps (s)
DOUBLE = TEMPS / 4     # double croche
rng = np.random.default_rng(7)


def t_(duree):
    return np.arange(int(duree * SR)) / SR


def env(duree, decay, attaque=0.002):
    t = t_(duree)
    return np.minimum(t / attaque, 1) * np.exp(-t / decay)


def bruit(duree):
    return rng.uniform(-1, 1, int(duree * SR))


def passe_bas(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def passe_haut(x, fc):
    return x - passe_bas(x, fc)


def balayage(x, fc0, fc1):
    """Passe-bas dont la coupure glisse de fc0 à fc1 (souffle)."""
    fcs = np.geomspace(fc0, fc1, len(x))
    a = np.exp(-2 * np.pi * fcs / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a[i]) * v + a[i] * acc
        y[i] = acc
    return y


def glisse(f0, f1, duree, decay):
    t = t_(duree)
    f = f1 + (f0 - f1) * np.exp(-t / decay)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# ---------------------------------------------------------------------------
# Instruments
# ---------------------------------------------------------------------------

def djembe_basse():
    return 0.9 * glisse(120, 72, 0.35, 0.03) * env(0.35, 0.16) + 0.15 * passe_bas(bruit(0.35), 900) * env(0.35, 0.01)


def djembe_ton():
    return 0.55 * glisse(300, 235, 0.2, 0.02) * env(0.2, 0.07) + 0.2 * np.sin(2 * np.pi * 470 * t_(0.2)) * env(0.2, 0.03)


def djembe_claque():
    b = passe_haut(bruit(0.15), 1200)
    return 0.6 * b * env(0.15, 0.025) + 0.25 * np.sin(2 * np.pi * 520 * t_(0.15)) * env(0.15, 0.02)


def shaker():
    return passe_haut(passe_haut(bruit(0.09), 4000), 4000) * env(0.09, 0.022, 0.008)


def cloche(f=1046.5):
    t = t_(0.5)
    return sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t / d) for k, a, d in [(1, 0.6, 0.18), (2.41, 0.3, 0.09), (3.93, 0.15, 0.05)])


def balafon(f):
    t = t_(0.7)
    corps = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.22)
    harmonique = 0.35 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t / 0.05)
    choc = 0.2 * passe_bas(bruit(0.7), 3000) * np.exp(-t / 0.006)
    return 0.6 * (corps + harmonique + choc)


def basse(f, duree):
    t = t_(duree)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    return 0.7 * np.tanh(1.5 * x) * np.minimum(t / 0.01, 1) * np.exp(-t / (duree * 0.9))


def souffle(duree, pic):
    """Whoosh : le bruit monte jusqu'à `pic` (s) puis retombe vite."""
    t = t_(duree)
    e = np.where(t < pic, (t / pic) ** 2, np.exp(-(t - pic) / 0.08))
    return 0.8 * balayage(bruit(duree), 300, 6000) * e


def montee(duree):
    t = t_(duree)
    return 0.5 * balayage(bruit(duree), 200, 9000) * (t / duree) ** 3


def boum():
    return 1.0 * glisse(90, 42, 1.4, 0.08) * env(1.4, 0.45) + 0.3 * passe_bas(bruit(1.4), 400) * env(1.4, 0.05)


def impact():
    return 0.9 * glisse(160, 55, 0.6, 0.04) * env(0.6, 0.18) + 0.45 * passe_bas(bruit(0.6), 2500) * env(0.6, 0.04)


def pop(f=700):
    return 0.5 * glisse(f * 1.6, f, 0.12, 0.015) * env(0.12, 0.04)


def ding():
    return 0.55 * (cloche(1318.5) + 0.6 * cloche(1975.5))


SONS = {
    'boum': boum(),
    'impact': impact(),
    'pop': pop(),
    'pop_aigu': pop(1100),
    'tic': pop(1600) * 0.5,
    'ding': ding(),
}

# ---------------------------------------------------------------------------
# Construction d'une piste
# ---------------------------------------------------------------------------

NOTES = {'G4': 392.0, 'A4': 440.0, 'C5': 523.25, 'D5': 587.33, 'E5': 659.26, 'G5': 783.99, 'A5': 880.0}
RIFF = [
    {0: 'E5', 2: 'G5', 3: 'A5', 6: 'G5', 8: 'E5', 10: 'D5', 11: 'E5', 14: 'C5'},
    {0: 'D5', 2: 'E5', 3: 'G5', 6: 'E5', 8: 'D5', 10: 'C5', 11: 'A4', 14: 'G4'},
]
BASSES = [65.41, 55.0, 87.31, 98.0]  # Do, La, Fa, Sol
MOTIF = {
    'basse': [0, 7, 10],
    'ton': [4, 6, 12, 14],
    'claque': [2, 11, 15],
    'cloche': [0, 3, 6, 8, 11, 14],
}
INSTR = {'basse': djembe_basse(), 'ton': djembe_ton(), 'claque': djembe_claque(), 'cloche': cloche() * 0.35}


class Piste:
    def __init__(self, beats):
        self.n = int((beats * TEMPS + 2) * SR)
        self.musique = np.zeros(self.n)
        self.effets = np.zeros(self.n)
        self.envoi = np.zeros(self.n)  # vers la réverbération
        self.duree = beats * TEMPS

    def pose(self, bus, son, beat, gain=1.0, reverb=0.0, decalage=0.0):
        i = int((beat * TEMPS + decalage) * SR)
        if i < 0:
            son, i = son[-i:], 0
        j = min(self.n, i + len(son))
        bus[i:j] += gain * son[: j - i]
        if reverb:
            self.envoi[i:j] += gain * reverb * son[: j - i]

    def effet(self, nom, beat, gain=1.0, reverb=0.25):
        self.pose(self.effets, SONS[nom], beat, gain, reverb)

    def souffle(self, beat, gain=0.55):
        """Whoosh dont le pic tombe sur `beat`."""
        d, pic = 0.7, 0.45
        self.pose(self.effets, souffle(d, pic), beat, gain, 0.2, -pic)

    def groove(self, debut, fin, percu=True, balafon_=True, basse_=True, gain=1.0):
        for pas in range(int(debut * 4), int(fin * 4)):
            beat = pas / 4
            p = pas % 16
            mesure = pas // 16
            # Shaker sur toutes les doubles croches, accent à contretemps.
            self.pose(self.musique, shaker(), beat, gain * (0.16 if p % 2 else 0.09))
            if percu:
                for nom, pas_ in MOTIF.items():
                    if p in pas_:
                        self.pose(self.musique, INSTR[nom], beat, gain * (0.5 if nom == 'cloche' else 0.8), 0.15 if nom == 'cloche' else 0.05)
            if basse_ and p in (0, 8):
                self.pose(self.musique, basse(BASSES[mesure % 4], TEMPS * 2), beat, gain * 0.55)
            if balafon_ and p in RIFF[mesure % 2]:
                self.pose(self.musique, balafon(NOTES[RIFF[mesure % 2][p]]), beat, gain * 0.32, 0.35)

    def mixe(self, sortie):
        ir_t = t_(1.6)
        ir = rng.uniform(-1, 1, len(ir_t)) * np.exp(-ir_t / 0.35)
        ir = passe_bas(ir, 5000)
        taille = 1 << int(np.ceil(np.log2(self.n + len(ir))))
        rev = np.fft.irfft(np.fft.rfft(self.envoi, taille) * np.fft.rfft(ir, taille), taille)[: self.n]
        rev *= 0.18 / (np.max(np.abs(rev)) + 1e-9)
        mono = 0.65 * self.musique + self.effets
        mono = mono / (np.max(np.abs(mono)) + 1e-9) * 0.8
        # Léger élargissement stéréo : la réverbération est décorrélée entre les canaux.
        decal = int(0.011 * SR)
        g = mono + rev
        d = mono + np.concatenate([np.zeros(decal), rev[:-decal]])
        st = np.stack([g, d], axis=1)[: int(self.duree * SR)]
        fondu = int(0.6 * SR)
        st[-fondu:] *= np.linspace(1, 0, fondu)[:, None] ** 2
        st /= np.max(np.abs(st)) + 1e-9
        ecrire(st * 0.9, sortie)


def ecrire(st, sortie):
    with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
        with wave.open(tmp.name, 'wb') as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((np.clip(st, -1, 1) * 32767).astype('<i2').tobytes())
        subprocess.run(
            ['ffmpeg', '-v', 'error', '-y', '-i', tmp.name, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
             '-ar', str(SR), '-b:a', '192k', str(sortie)],
            check=True,
        )


# ---------------------------------------------------------------------------
# Repères par scène (mêmes valeurs que l'image)
# ---------------------------------------------------------------------------

def scene(p, nom, s, cfg):
    c = C.get(nom, {})
    if nom == 'intro':
        p.effet('boum', s, 0.9, 0.3)
        p.effet('pop', s + c['case'], 0.7)
        p.pose(p.effets, montee(TEMPS), s + c['titre'] - 1, 0.6)
        p.effet('impact', s + c['titre'], 1.0, 0.35)
        p.souffle(s + c['accroche'] + 0.3, 0.3)
        p.effet('pop_aigu', s + c['ville'], 0.7)
    elif nom == 'promesse':
        p.effet('impact', s + c['l1'], 0.6)
        p.effet('impact', s + c['l2'], 0.6)
        for x in c['puces']:
            p.effet('pop', s + x, 0.8)
    elif nom == 'origines':
        p.souffle(s + c['titre'] + 0.3, 0.3)
        p.pose(p.effets, montee(TEMPS), s + c['carte'] - 0.5, 0.35)
        for i, x in enumerate(c['pays']):
            p.pose(p.effets, pop(700 * 1.12 ** i), s + x, 0.8, 0.25)
        p.souffle(s + c['arc'] + 1, 0.4)
        p.effet('ding', s + c['toulouse'], 0.8, 0.4)
    elif nom == 'engagements':
        p.souffle(s + c['titre'] + 0.3, 0.25)
        for x in c['cartes']:
            p.effet('impact', s + x, 0.45)
            p.effet('pop', s + x + 0.1, 0.6)
    elif nom == 'menu':
        bpp = cfg['beatsParPlat']
        for i in range(len(cfg['plats'])):
            d = s + i * bpp
            if i:
                p.souffle(d + 0.3, 0.45)
            p.effet('pop', d + 0.6, 0.55)
            p.effet('tic', d + C['plat']['nom'], 0.5)
            p.effet('ding', d + C['plat']['prix'], 0.6, 0.35)
    elif nom == 'desserts':
        for x in c['bols']:
            p.effet('pop', s + x + 0.4, 0.6)
        p.effet('ding', s + c['prix'], 0.6, 0.35)
        p.effet('ding', s + c['prix'] + 0.2, 0.45, 0.35)
    elif nom == 'commande':
        p.effet('impact', s + c['titre'], 0.5)
        for x in c['cartes']:
            p.effet('pop', s + x, 0.7)
        p.effet('pop_aigu', s + c['horaires'], 0.6)
    elif nom == 'fin':
        p.effet('pop', s + c['logo'], 0.6)
        p.effet('impact', s + c['logo'] + 1, 0.8, 0.3)
        p.souffle(s + c['logo'] + 2.3, 0.25)
        for x in c['infos']:
            p.effet('tic', s + x, 0.45)
        p.effet('impact', s + c['slogan'], 0.9, 0.4)
        p.effet('ding', s + c['slogan'], 0.5, 0.5)


def piste(cle, sortie):
    cfg = T[cle]
    beats = cfg['beats']
    scenes = cfg['scenes']
    p = Piste(beats)
    for nom, debut in scenes[1:]:
        p.souffle(debut)  # volets de transition
    for nom, debut in scenes:
        scene(p, nom, debut, cfg)

    # Musique : cloche + shaker dès le début, groove complet à la 2e mesure,
    # arrêt sur le slogan final, puis balafon seul jusqu'au fondu.
    final = scenes[-1][1] + C['fin']['slogan']
    p.groove(0, 4, percu=False, balafon_=False, basse_=False, gain=0.8)
    p.groove(4, 8, balafon_=False)
    p.groove(8, final)
    p.groove(final, beats, percu=False, basse_=False, gain=0.55)
    for f in (130.81, 196.0, 261.63, 329.63):
        p.pose(p.musique, balafon(f * 2), final, 0.3, 0.6)
    p.mixe(sortie)
    print(f'OK → {sortie.relative_to(RACINE)}')


if __name__ == '__main__':
    dossier = RACINE / 'public/lebreak'
    dossier.mkdir(parents=True, exist_ok=True)
    piste('v30', dossier / 'son-30s.mp3')
    piste('v45', dossier / 'son-45s.mp3')
