""" This module loads audio files, performs FFT and returns audio data as NumPy array. """

import cmath
import math
import pickle
import sys
import subprocess as sp

from typing import Any

import numpy as np

import parameters as params
import librosa


def load_mp3(srcfile: str) -> np.ndarray:
    """ Reads any sound file into memory.
    srcfile:  mp3 file path
    returns:  content (np.ndarray Nx2)
    """
    command = ['ffmpeg', '-i', srcfile, '-f', 's16le', '-acodec', 'pcm_s16le',
               '-ar', str(params.SAMPLING_FREQ), '-ac', '2', '-']
    res = sp.run(command, stdout=sp.PIPE, stderr=sp.PIPE, bufsize=10**8)

    if res.returncode:
        print("ffmpeg error when processing '%s'" % srcfile)
        print(res.stderr)
        sys.exit(0)

    sound = np.fromstring(res.stdout, dtype='int16')
    sound = sound.reshape((len(sound) // 2, 2))

    return sound

# def play_mp3(sound):
#     """ Plays sound (stereo only).
#     sound:    np.ndarray Nx2
#     """
#     import pygame, time
#     pygame.mixer.init(SAMPLING_FREQ, -16, 1)
#     snd = pygame.sndarray.make_sound(sound)
#     snd.play()
#     time.sleep(10)

def convert_stereo_to_mono(sound: np.ndarray) -> np.ndarray:
    """ Combines stereo sound channels into a mono sound.
    sound:    np.ndarray Nx2
    returns:   np.ndarray N
    """
    if sound.shape[1] == 1:
        return sound

    left    = sound[:, 0]
    right   = sound[:, 1]
    res = (left + right) / 2
    return res

def convert_int16_to_float(sound: np.ndarray) -> np.ndarray:
    """ Normalizes sound to range [-1, 1]
    sound:    source, np.ndarray of shorts
    returns:   result, np.ndarray of floats
    """
    res = sound / float(2 ** 15)
    return res

def perform_fft(sound: np.ndarray, window_size: int) -> np.ndarray:
    """ Splits sound into windows, applies a window function to them and
    performs FFT.
    sound:          mono sound (np.ndarray)
    window_size:    int
    returns:        np.ndarray of size (num_time_bins, num_freq_bins, num_ch)
    (2 channels are amplitude and phase, window_size/2 values in each freq bin)
    """
    num_win = (sound.size + window_size - 1) // window_size
    sound   = np.resize(sound, num_win * window_size)
    sound.resize(num_win, window_size)

    win_func = np.hanning(window_size) # precalculate window function
    res = np.zeros((num_win, window_size // 2, 2), dtype=np.float32)

    for time_bin, w in enumerate(sound):
        w   *= win_func
        fft = np.fft.rfft(w)
        fft /= window_size

        for freq_bin in range(window_size // 2):
            # convert complex values into tuple of real ones (polar form)
            res[time_bin, freq_bin, :] = cmath.polar(fft[freq_bin])

    return res

def read_mp3_with_fft(filename: str, window_size: int) -> np.ndarray:
    """ Reads mp3 file, converts stereo to mono F32 and performs FFT
    filename:   file path
    returns:    np.ndarray as from perform_fft()
    """
    sound   = load_mp3(filename)
    sound   = convert_stereo_to_mono(sound)
    sound   = convert_int16_to_float(sound)
    windows = perform_fft(sound, window_size)

    return windows

def perform_cqt(sound_data: np.ndarray) -> np.ndarray:
    """ Performs CQT on sound data with default window.
    Returns: np.ndarray(time_range, pitch_range, num_ch), channels are amp & phase. """
    transform = librosa.cqt(sound_data, hop_length=params.WINDOW_SIZE,
                            sr=params.SAMPLING_FREQ, n_bins=params.PITCH_RANGE)

    pitch_range, time_range = transform.shape
    assert pitch_range == params.PITCH_RANGE
    res = np.zeros((time_range, pitch_range, 2))

    for time_bin in range(time_range):
        for pitch in range(pitch_range):
            res[time_bin, pitch, :] = cmath.polar(transform[pitch, time_bin])

    return res

def read_mp3_with_cqt(filename: str) -> np.ndarray:
    """ Reads mp3 file, converts stereo to mono F32 and performs CDQ.
    Returns: np.ndarray as from perform_cdq() """
    sound   = load_mp3(filename)
    sound   = convert_stereo_to_mono(sound)
    sound   = convert_int16_to_float(sound)
    res     = perform_cqt(sound)

    return res

def save_to_pickle(pklfile: str, obj: Any) -> None:
    """ Saves object to pickle """
    with open(pklfile, 'wb') as f:
        pickle.dump(obj, f)

def load_from_pickle(pklfile: str) -> Any:
    """ Loads object from pickle """
    with open(pklfile, 'rb') as f:
        return pickle.load(f)

def freq2pitch(freq: float) -> int:
    """ Transforms frequency to pitch. """
    return 69 + math.floor(12 * math.log2(freq / 440) + 0.5)

def pitch2freq(pitch: int) -> float:
    """ Transforms pitch to frequency. """
    return 440 * math.pow(2, (pitch - 69) / 12)
