"""Sound design discret pour ParcoursRS6601 (pas de musique) : nappe très douce,
souffles sur les déplacements, notes ascendantes à chaque étape, accord final.

Usage : python3 scripts/parcours_audio.py  → public/audio/parcours-rs6601.wav
Les temps sont lus dans src/parcoursTiming.json (même source que la vidéo).
"""
import json
import pathlib
import wave

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
T = json.loads((ROOT / "src/parcoursTiming.json").read_text())
SR = 48000
DUR = T["durationS"]
n = int(SR * DUR)
out = np.zeros(n)
rng = np.random.default_rng(6601)

N = 7
ARRIVE = [T["firstArrival"] + i * T["stepPeriod"] for i in range(N)]
DEPART = [ARRIVE[i + 1] - T["travel"] for i in range(N - 1)]


def add(sig, at, gain=1.0):
    i0 = int(at * SR)
    i1 = min(n, i0 + len(sig))
    if i1 > i0:
        out[i0:i1] += sig[: i1 - i0] * gain


def bell(freq, dur=1.6, decay=3.0):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / 0.006) * np.exp(-decay * t)
    s = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * 2 * freq * t) * np.exp(-6 * t)
    s += 0.08 * np.sin(2 * np.pi * 2.76 * freq * t) * np.exp(-9 * t)
    return s * env


def tick(freq=1600, dur=0.06):
    t = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * freq * t) * np.exp(-60 * t)


def whoosh(dur=1.2, lo=300, hi=2400):
    m = int(dur * SR)
    t = np.arange(m) / SR
    noise = rng.standard_normal(m)
    cut = lo + (hi - lo) * np.sin(np.pi * t / dur)
    a = np.exp(-2 * np.pi * cut / SR)
    y = np.zeros(m)
    acc = 0.0
    for k in range(m):
        acc = (1 - a[k]) * noise[k] + a[k] * acc
        y[k] = acc
    return y * np.sin(np.pi * t / dur) ** 2


def chord(freqs, dur=3.5, decay=1.2):
    return sum(bell(f, dur, decay) for f in freqs) / len(freqs)


# --- Nappe très douce (C majeur), fondu d'entrée et de sortie --------------
t = np.arange(n) / SR
pad = sum(np.sin(2 * np.pi * f * t + p) for f, p in [(130.81, 0), (196.0, 1), (261.63, 2), (329.63, 3)])
pad *= 0.5 + 0.5 * np.sin(2 * np.pi * 0.08 * t) ** 2
pad *= np.clip(t / 3, 0, 1) * np.clip((DUR - t) / 2.5, 0, 1)
out += pad * 0.012

# --- Intro --------------------------------------------------------------------
add(whoosh(0.9, 200, 1800), 0.15, 0.10)
add(bell(261.63, 2.5, 1.5), 0.4, 0.22)
add(bell(392.0, 2.0, 2.0), 0.95, 0.10)
add(whoosh(0.8, 300, 2000), T["introOut"][0], 0.07)
for i in range(N):
    add(tick(1400 + 90 * i), T["ghostNodeStart"] + i * T["ghostNodeStagger"], 0.10)

# --- Parcours -----------------------------------------------------------------
add(whoosh(1.4, 250, 2200), T["zoomIn"][0], 0.12)
NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]
for i in range(N - 1):
    add(bell(NOTES[i]), ARRIVE[i], 0.30)
    add(tick(2200), ARRIVE[i] + 0.5, 0.05)
for d in DEPART:
    add(whoosh(T["travel"], 300, 2600), d, 0.10)
# Certification
add(chord([523.25, 659.25, 783.99, 1046.5], 4.0, 1.0), ARRIVE[-1], 0.42)
add(bell(2093.0, 1.2, 4), ARRIVE[-1] + 0.12, 0.06)

# --- Vue d'ensemble, récap, final -------------------------------------------
add(whoosh(2.0, 200, 1600), T["zoomOut"][0], 0.12)
a, b = T["recap"]


def ease_in_out_cubic(p):
    return 4 * p**3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2


grid = np.linspace(0, 1, 4000)
eased = np.array([ease_in_out_cubic(p) for p in grid])
RECAP_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]
for i in range(N - 1):
    p = grid[np.argmax(eased >= i / (N - 1) - 1e-6)]
    add(bell(RECAP_NOTES[i], 0.8, 5), a + p * (b - a), 0.14)
add(chord([261.63, 329.63, 392.0, 523.25, 659.25], 6.0, 0.7), b, 0.45)
add(bell(1567.98, 1.5, 3), b + 0.08, 0.05)
add(tick(1800), T["message"][0], 0.06)
add(tick(2000), T["message"][1], 0.06)

# --- Mixage --------------------------------------------------------------------
out *= 10 ** (-6 / 20) / np.max(np.abs(out))
fade = np.clip((DUR - t) / 0.05, 0, 1)
pcm = (out * fade * 32767).astype(np.int16)
stereo = np.repeat(pcm[:, None], 2, axis=1)
dst = ROOT / "public/audio/parcours-rs6601.wav"
with wave.open(str(dst), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print(dst, f"{DUR}s")
