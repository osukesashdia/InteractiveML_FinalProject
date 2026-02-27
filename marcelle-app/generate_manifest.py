import json
import os
import xml.etree.ElementTree as ET

ann_dir = "archive/Annotations/Annotations"
manifest = []
for f in sorted(os.listdir(ann_dir)):
    if not f.endswith(".xml"):
        continue
    tree = ET.parse(os.path.join(ann_dir, f))
    root = tree.getroot()
    fname = root.find("filename").text
    size = root.find("size")
    w = float(size.find("width").text)
    h = float(size.find("height").text)
    obj = root.find("object")
    if obj is None:
        print(f"  Skipping {f}: no <object> element")
        continue
    bb = obj.find("bndbox")
    if bb is None:
        print(f"  Skipping {f}: no <bndbox> element")
        continue
    entry = {
        "file": fname,
        "width": int(w),
        "height": int(h),
        "bbox": {
            "xmin": float(bb.find("xmin").text),
            "ymin": float(bb.find("ymin").text),
            "xmax": float(bb.find("xmax").text),
            "ymax": float(bb.find("ymax").text),
        },
    }
    if os.path.isfile(os.path.join("archive", fname)):
        manifest.append(entry)

with open("public/archive/manifest.json", "w") as fp:
    json.dump(manifest, fp, indent=2)
print(f"Generated manifest with {len(manifest)} entries")
