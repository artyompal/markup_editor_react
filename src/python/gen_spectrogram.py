""" This script generates spectrogram for a given file. It uses CQT or FFT as a basis. """

import argparse
import itertools
import math
import os
import sys

import numpy as np

from scipy.stats import describe
from PIL import Image

import sound_lib as snd


EPSILON = 1e-20

RANGE = 30
GAIN = 0

COLOR_TABLE = [
    np.array([0.75, 0.75, 0.75]),
    np.array([0.30, 0.60, 1.00]),
    np.array([0.90, 0.10, 0.90]),
    np.array([1.00, 0.00, 0.00]),
    np.array([1.00, 1.00, 1.00]),
]

def encode_intensity(val: float) -> np.ndarray:
    assert val >= 0 and val <= 1

    point = val * (len(COLOR_TABLE) - 1)
    left = int(math.floor(point))
    right = min(left + 1, len(COLOR_TABLE) - 1)
    weight = point - left

    return COLOR_TABLE[left] * (1 - weight) + COLOR_TABLE[right] * weight

def normalize_values(data: np.ndarray) -> np.ndarray:
    min_lower = -RANGE / 10
    max_upper = -GAIN / 10

    data = np.clip(data, min_lower, max_upper) # type: ignore

    data -= np.min(data)
    data /= np.max(data)
    return data

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('imagefile', help='name of the output file')
    parser.add_argument('soundfile', help='path to the sound file (input parameter)')
    args = parser.parse_args()

    # print('generating spectrogram...')
    data = snd.read_mp3_with_cqt(args.soundfile)
    data = data[..., 0] # drop phase

    # print(data.shape)
    # print('data distribution:', describe(data.flatten()))

    data = data[::10] # resample
    data = np.transpose(data)
    data = np.flipud(data)


    # convert to log10 scale with clamping
    data = np.maximum(data, EPSILON)
    data = np.log10(data)
    # print('data in log-scale:', describe(data.flatten()))

    data = normalize_values(data)
    # print('data after transforms:', describe(data.flatten()))

    # allocate the result
    rgb = np.zeros(data.shape[:2] + (3,), dtype=np.uint8)

    for i, j in itertools.product(range(data.shape[0]), range(data.shape[1])):
        col = data[i, j]

        res = encode_intensity(col)
        res = (res * 255).astype(np.uint8)
        assert res.shape == (3,), f'{res.shape} is unexpected'
        rgb[i, j] = res


    # print('in RGB:', describe(rgb.flatten()))

    dirname = os.path.dirname(args.imagefile);
    os.makedirs(dirname, exist_ok=True)
    img = Image.fromarray(rgb)
    img.save(args.imagefile)
