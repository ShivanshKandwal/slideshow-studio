import numpy as np
import scipy.io.wavfile as wav
import subprocess
import os
from pathlib import Path

AUDIO_DIR = Path("C:/Software/slideshow-studio/backend/static/audio")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_RATE = 44100

def export_wav_to_mp3(wav_path, mp3_path):
    cmd = [
        "ffmpeg", "-y", "-i", str(wav_path),
        "-codec:a", "libmp3lame", "-b:a", "192k",
        str(mp3_path)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    if os.path.exists(wav_path):
        os.remove(wav_path)

def generate_ambient_drone(duration=180):
    """
    Generates a lush, copyright-free meditative ambient soundscape (432Hz root, warm detuned pads, gentle sub drone, soft pink noise shimmer).
    Completely synthetic & mathematically generated -> 0% copyright claim risk.
    """
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    signal = np.zeros_like(t)

    # Chords: C#m9 / A / E / B meditative ambient progression
    frequencies = [
        (138.59, 0.25),  # C#3
        (164.81, 0.20),  # E3
        (207.65, 0.18),  # G#3
        (246.94, 0.15),  # B3
        (329.63, 0.12),  # E4
        (69.30,  0.30),  # C#2 Sub
    ]

    for freq, amp in frequencies:
        # Subtle chorus detuning & slow LFO amplitude swell
        lfo_rate = 0.08 + (freq % 5) * 0.02
        lfo = 0.6 + 0.4 * np.sin(2 * np.pi * lfo_rate * t)
        
        # Dual detuned oscillators for lush stereo/chorus feel
        osc1 = np.sin(2 * np.pi * freq * t)
        osc2 = np.sin(2 * np.pi * (freq * 1.002) * t)
        osc3 = np.sin(2 * np.pi * (freq * 0.998) * t)
        
        signal += amp * lfo * ((osc1 + osc2 + osc3) / 3.0)

    # Add gentle ocean/wind pink noise shimmer
    noise = np.random.normal(0, 0.02, len(t))
    noise_lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.04 * t)
    signal += noise * noise_lfo

    # Smooth fade in and fade out (5 seconds)
    fade_len = int(SAMPLE_RATE * 5)
    fade_in = np.linspace(0, 1, fade_len)
    fade_out = np.linspace(1, 0, fade_len)
    signal[:fade_len] *= fade_in
    signal[-fade_len:] *= fade_out

    # Normalize to -1.5 dB
    signal = signal / (np.max(np.abs(signal)) + 1e-6) * 0.85
    audio_int16 = (signal * 32767).astype(np.int16)

    # Stereo
    stereo = np.column_stack((audio_int16, audio_int16))
    wav_out = AUDIO_DIR / "temp_ambient.wav"
    wav.write(str(wav_out), SAMPLE_RATE, stereo)
    export_wav_to_mp3(wav_out, AUDIO_DIR / "calm_ambient_1.mp3")
    print("calm_ambient_1.mp3 generated successfully")

def generate_soft_piano_chords(duration=180):
    """
    Generates minimal, spaced, warm Rhodes/Piano electric bell-chords decaying over a gentle pad.
    100% procedurally synthesized without samples -> 0% copyright claim risk.
    """
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    signal = np.zeros_like(t)

    # 4 repeating peaceful chords every 6 seconds
    # Cmaj7 -> Am7 -> Fmaj7 -> Gsus4
    chords = [
        [261.63, 329.63, 392.00, 493.88], # Cmaj7
        [220.00, 261.63, 329.63, 392.00], # Am7
        [174.61, 261.63, 329.63, 349.23], # Fmaj7
        [196.00, 261.63, 293.66, 392.00], # Gsus4
    ]

    chord_interval = 6.0 # seconds
    total_chords = int(duration / chord_interval)

    for i in range(total_chords):
        chord = chords[i % len(chords)]
        start_time = i * chord_interval
        start_sample = int(start_time * SAMPLE_RATE)
        event_len = int(chord_interval * 1.5 * SAMPLE_RATE) # let decay overlap
        if start_sample >= len(t):
            break
        
        sub_t = np.linspace(0, chord_interval * 1.5, event_len, False)
        # Exponential acoustic decay
        envelope = np.exp(-sub_t * 0.75) * (1.0 - np.exp(-sub_t * 50)) # sharp strike, warm decay
        
        chord_wave = np.zeros_like(sub_t)
        for note_freq in chord:
            # Fundamental + soft harmonics
            f1 = np.sin(2 * np.pi * note_freq * sub_t)
            f2 = 0.35 * np.sin(2 * np.pi * (note_freq * 2) * sub_t) * np.exp(-sub_t * 1.5)
            f3 = 0.15 * np.sin(2 * np.pi * (note_freq * 3) * sub_t) * np.exp(-sub_t * 3.0)
            chord_wave += (f1 + f2 + f3)

        strike = chord_wave * envelope * 0.2
        end_sample = min(len(signal), start_sample + event_len)
        signal[start_sample:end_sample] += strike[:end_sample - start_sample]

    # Warm low-end bed
    sub_bed = 0.15 * np.sin(2 * np.pi * 65.4 * t) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.1 * t))
    signal += sub_bed

    # Smooth fade out
    fade_len = int(SAMPLE_RATE * 4)
    signal[:fade_len] *= np.linspace(0, 1, fade_len)
    signal[-fade_len:] *= np.linspace(1, 0, fade_len)

    signal = signal / (np.max(np.abs(signal)) + 1e-6) * 0.85
    audio_int16 = (signal * 32767).astype(np.int16)
    stereo = np.column_stack((audio_int16, audio_int16))
    wav_out = AUDIO_DIR / "temp_piano.wav"
    wav.write(str(wav_out), SAMPLE_RATE, stereo)
    export_wav_to_mp3(wav_out, AUDIO_DIR / "calm_piano_1.mp3")
    print("calm_piano_1.mp3 generated successfully")

def generate_lofi_chill_groove(duration=180):
    """
    Generates a gentle tape-warmed, lo-fi aesthetic chill background.
    100% synthetically generated -> 0% copyright claim risk.
    """
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    signal = np.zeros_like(t)

    # Chords: F#m7 -> Bm7 -> Dmaj7 -> E
    chords = [
        [185.00, 220.00, 277.18, 329.63],
        [123.47, 146.83, 220.00, 293.66],
        [146.83, 185.00, 220.00, 277.18],
        [164.81, 207.65, 246.94, 329.63]
    ]

    tempo_bpm = 72
    beat_sec = 60.0 / tempo_bpm
    bar_sec = beat_sec * 4

    total_bars = int(duration / bar_sec)
    for b in range(total_bars):
        chord = chords[b % len(chords)]
        b_start = int(b * bar_sec * SAMPLE_RATE)
        b_len = int(bar_sec * 1.2 * SAMPLE_RATE)
        sub_t = np.linspace(0, bar_sec * 1.2, b_len, False)
        
        # Tape flutter / wow modulation
        wow = 1.0 + 0.003 * np.sin(2 * np.pi * 1.8 * sub_t)
        
        c_wave = np.zeros_like(sub_t)
        for f in chord:
            c_wave += np.sin(2 * np.pi * (f * wow) * sub_t) + 0.25 * np.sin(2 * np.pi * (f * 2 * wow) * sub_t)
        
        # Soft tremolo envelope
        tremolo = 0.5 + 0.5 * np.sin(2 * np.pi * (tempo_bpm / 60.0 * 2) * sub_t)
        c_wave *= (0.7 + 0.3 * tremolo) * np.exp(-sub_t * 0.3)
        
        end_s = min(len(signal), b_start + b_len)
        signal[b_start:end_s] += (c_wave * 0.18)[:end_s - b_start]

    # Vinyl tape noise emulation
    vinyl = np.random.normal(0, 0.015, len(t))
    signal += vinyl

    # Fade in & out
    fade_len = int(SAMPLE_RATE * 3)
    signal[:fade_len] *= np.linspace(0, 1, fade_len)
    signal[-fade_len:] *= np.linspace(1, 0, fade_len)

    signal = signal / (np.max(np.abs(signal)) + 1e-6) * 0.85
    audio_int16 = (signal * 32767).astype(np.int16)
    stereo = np.column_stack((audio_int16, audio_int16))
    wav_out = AUDIO_DIR / "temp_lofi.wav"
    wav.write(str(wav_out), SAMPLE_RATE, stereo)
    export_wav_to_mp3(wav_out, AUDIO_DIR / "calm_lofi_1.mp3")
    print("calm_lofi_1.mp3 generated successfully")

if __name__ == "__main__":
    generate_ambient_drone()
    generate_soft_piano_chords()
    generate_lofi_chill_groove()
    print("ALL SYNTHETIC NO-COPYRIGHT TRACKS GENERATED")
