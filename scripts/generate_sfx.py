"""Génère les sons d'interface discrets (WAV 48 kHz mono) utilisés en cue points.

Usage : python3 scripts/generate_sfx.py  → écrit dans public/sfx/
"""
import wave
from pathlib import Path

import numpy as np

SR = 48_000
OUT = Path(__file__).resolve().parent.parent / "public" / "sfx"
rng = np.random.default_rng(7)


def t(dur):
    return np.arange(int(SR * dur)) / SR


def env(n, attack=0.004, decay=0.08):
    x = np.arange(n) / SR
    a = np.clip(x / attack, 0, 1)
    return a * np.exp(-x / decay)


def tone(freq_start, freq_end, dur, decay, harm=0.15):
    x = t(dur)
    f = np.geomspace(freq_start, freq_end, x.size)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sig = np.sin(ph) + harm * np.sin(2 * ph)
    return sig * env(x.size, decay=decay)


def lowpass(sig, cutoff):
    # Simple filtre passe-bas à un pôle
    a = np.exp(-2 * np.pi * cutoff / SR)
    out = np.empty_like(sig)
    acc = 0.0
    for i, s in enumerate(sig):
        acc = (1 - a) * s + a * acc
        out[i] = acc
    return out


def fade_out(sig, ms=8):
    n = int(SR * ms / 1000)
    sig[-n:] *= np.linspace(1, 0, n)
    return sig


def write(name, sig, peak_db):
    sig = fade_out(sig.astype(np.float64))
    sig = sig / np.max(np.abs(sig)) * 10 ** (peak_db / 20)
    pcm = (sig * 32767).astype(np.int16)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def mix(*parts):
    n = max(len(p) for _, p in parts)
    out = np.zeros(n)
    for offset, p in parts:
        o = int(SR * offset)
        out[o:o + len(p)] += p[: n - o]
    return out


OUT.mkdir(parents=True, exist_ok=True)

# Apparition d'un bloc : petit « pop » arrondi
write("pop", tone(520, 880, 0.14, 0.035, harm=0.1), -14)

# Activation d'un bloc : clic doux à deux composantes
click = lowpass(rng.standard_normal(int(SR * 0.03)) * env(int(SR * 0.03), 0.001, 0.004), 3500)
write("select", mix((0, click * 0.6), (0.004, tone(1320, 1240, 0.12, 0.03, harm=0.05))), -15)

# Tracé d'une connexion : souffle filtré très léger
n = int(SR * 0.45)
x = np.arange(n) / SR
noise = lowpass(rng.standard_normal(n), 1800)
swell = np.sin(np.pi * x / x[-1]) ** 2
write("swoosh", noise * swell, -22)

# Donnée qui circule : bulle montante
write("data", tone(600, 1100, 0.18, 0.06, harm=0.05), -18)

# Séparation en deux chemins : deux notes qui s'écartent
write("split", mix((0, tone(740, 620, 0.2, 0.06)), (0.07, tone(740, 990, 0.22, 0.07))), -16)

# Succès : petit carillon ascendant
write("success", mix(
    (0, tone(784, 784, 0.35, 0.12, harm=0.2)),
    (0.09, tone(1046, 1046, 0.45, 0.16, harm=0.2)),
    (0.18, tone(1318, 1318, 0.6, 0.22, harm=0.15)),
), -14)

# Transition de titre : tic très court
write("tick", tone(1800, 1600, 0.05, 0.012, harm=0.0), -20)

print("SFX écrits dans", OUT)
