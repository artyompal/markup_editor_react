""" This file run in the background and renders each measure into a standalone PGN file. """
import argparse
import os
import subprocess
import xml.etree.ElementTree as xmltree

from zipfile import ZipFile
from typing import *


def replace_ext(path: str, new_extension: str) -> str:
    return os.path.splitext(path)[0] + new_extension

def process_all_measures(src: Any, image_path_fmt: str) -> None:
    measure_idx = 0
    stop = False

    while not stop:
        measure_idx += 1

        dst = xmltree.Element('score-partwise')
        dst.append(src.find('identification'))
        dst.append(src.find('defaults'))
        dst.append(src.find('part-list'))

        for src_part in src.findall('part'):
            dst_part = xmltree.SubElement(dst, 'part', **src_part.attrib)
            measures = src_part.findall(f'measure[@number=\'{measure_idx}\']')

            if not measures:
                stop = True
                break

            for measure in measures:
                dst_part.append(measure)

        measure_img_path = image_path_fmt % measure_idx
        measure_xml_path = replace_ext(measure_img_path, '.xml')

        path, ext = os.path.splitext(measure_img_path)
        out_path = path + '-1' + ext

        if os.path.exists(measure_img_path):
            continue

        xmltree.ElementTree(dst).write(measure_xml_path)
        res = subprocess.run(['musescore', measure_xml_path, '-o', measure_img_path],
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        os.unlink(measure_xml_path)

        if res.returncode:
            print('error while converting to PNG')
            return

        os.rename(out_path, measure_img_path)
        extra_idx = 2

        while os.path.exists(path + str(-extra_idx) + ext):
            os.unlink(path + str(-extra_idx) + ext)
            extra_idx += 1

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('imagefile', help='path format of the output file, like img_{}.png')
    parser.add_argument('scorefile', help='path to the scores (input parameter)')
    args = parser.parse_args()

    print('creating', os.path.dirname(args.imagefile))
    os.makedirs(os.path.dirname(args.imagefile), exist_ok=True)

    if os.path.exists(args.scorefile):
        tree = xmltree.parse(args.scorefile)
        root = tree.getroot()
    else:
        with ZipFile('/mnt/data/guitar/musicxml.zip') as zf:
            prefix = '/mnt/data/guitar/'
            assert args.scorefile.startswith(prefix)

            with zf.open(args.scorefile[len(prefix):]) as f:
                root = xmltree.fromstring(f.read())

    process_all_measures(root, args.imagefile)
