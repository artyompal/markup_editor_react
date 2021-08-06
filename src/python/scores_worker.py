
import argparse
import os
import subprocess
import xml.etree.ElementTree as xmltree

from typing import *


def replace_ext(path: str, new_extension: str) -> str:
    return os.path.splitext(path)[0] + new_extension

def get_musescore_out_names(path: str) -> Tuple[str, str]:
    name, ext = os.path.splitext(path)
    return name + '-1' + ext, name + '-2' + ext

def select_measure(src: Any, image_path_fmt: str) -> None:
    dst = xmltree.Element('score-partwise')
    dst.append(src.find('identification'))
    dst.append(src.find('defaults'))
    dst.append(src.find('part-list'))

    measure_idx = 0
    stop = False

    while not stop:
        measure_idx += 1

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
        out_path_1, out_path_2 = get_musescore_out_names(measure_img_path)

        if os.path.exists(measure_img_path):
            continue

        xmltree.ElementTree(dst).write(measure_xml_path)
        res = subprocess.run(['musescore', measure_xml_path, '-o', measure_img_path],
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        os.unlink(measure_xml_path)

        if res.returncode:
            print('error while converting to PNG')
            return

        os.rename(out_path_1, measure_img_path)

        if os.path.exists(out_path_2):
            os.unlink(out_path_2)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('imagefile', help='path format of the output file, like img_{}.png')
    parser.add_argument('scorefile', help='path to the scores (input parameter)')
    args = parser.parse_args()

    tree = xmltree.parse(args.scorefile)
    root = tree.getroot()

    select_measure(root, args.imagefile)
