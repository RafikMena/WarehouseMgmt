import sys
import os
import json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.graphics.barcode import createBarcodeDrawing

def get_next_roll(base_dir):
    os.makedirs(base_dir, exist_ok=True)
    existing = [
        f for f in os.listdir(base_dir)
        if f.startswith("barcode_") and f.endswith(".pdf")
    ]
    numbers = [
        int(f.split("_")[1].split(".")[0])
        for f in existing if f.split("_")[1].split(".")[0].isdigit()
    ]
    return max(numbers, default=0) + 1

def generate_sheet(entries, output_path):
    c = canvas.Canvas(output_path, pagesize=letter)
    page_width, page_height = letter

    rows = 5
    cols = 2
    barcode_height = 50

    col_width = page_width / cols
    row_height = page_height / rows

    for idx, (roll, item, yards) in enumerate(entries):
        row = idx // cols
        col = idx % cols

        x_center = col_width * col + col_width / 2
        y = page_height - (row * row_height + row_height / 2 + barcode_height / 2)

        encoded = f"I:{item},R:{roll},Y:{yards}"
        barcode = createBarcodeDrawing('Code128', value=encoded, barHeight=barcode_height, humanReadable=True)
        barcode_width = barcode.width

        barcode.drawOn(c, x_center - barcode_width / 2, y)

    c.save()



if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_barcode_sheet.py path_to_barcode_list.json")
        sys.exit(1)

    with open(sys.argv[1], 'r') as f:
        raw_entries = json.load(f)

    if not raw_entries:
        print("No barcodes provided.")
        sys.exit(1)

    sheet_entries = []
    for raw in raw_entries[:10]:
        parts = raw.split('|')
        if len(parts) == 3:
            roll, item, yards = parts
        elif len(parts) == 2:
            item, yards = parts
            roll = None
        else:
            print(f"Invalid format: {raw}")
            continue

        base_dir = os.path.join(os.getcwd(), "data", "barcodes", item)
        os.makedirs(base_dir, exist_ok=True)

        if not roll or not roll.strip():
            roll = str(get_next_roll(base_dir))

        sheet_entries.append((roll, item, yards))

    # ✅ Store sheet in same folder as first item's barcode folder
    first_item = sheet_entries[0][1]
    save_dir = os.path.join(os.getcwd(), "data", "barcodes", first_item)
    os.makedirs(save_dir, exist_ok=True)

    output_path = os.path.join(save_dir, "barcode_sheet.pdf")
    generate_sheet(sheet_entries, output_path)

    print(output_path)
