import sys
import json
import os
import pdfkit


# Set the correct path to your local wkhtmltopdf executable
wkhtmltopdf_path = os.path.join(os.getcwd(), 'wkhtmltopdf.exe')
config = pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_path)

# Generate the PDF using local executable

if len(sys.argv) < 2:
    print("Usage: python generate_packing_slip.py path_to_json")
    sys.exit(1)

json_path = sys.argv[1]

with open(json_path, 'r') as f:
    data = json.load(f)

# Load HTML template
template_path = os.path.join(os.getcwd(),'packing',"templates", "packing_template.html")
with open(template_path, 'r') as f:
    html = f.read()

# Inject data
html = html.replace("{{customer}}", data["customer"])
html = html.replace("{{invoice}}", data["invoice"])
html = html.replace("{{billTo}}", data["billTo"])
html = html.replace("{{shipTo}}", data["shipTo"])
html = html.replace("{{po}}", data["po"])
html = html.replace("{{shipDate}}", data["shipDate"])
html = html.replace("{{date}}", data["date"])

rows = ""
for item in data["items"]:
    if isinstance(item["desc"], list):
        desc_lines = "<br>".join(item["desc"])
        pkg_lines = "<br>".join(str(p) for p in item["pkg"])
        qty_lines = "<br>".join(str(q) for q in item["qty"])

        total_pkg = len(item["pkg"])
        total_qty = sum(item["qty"])

        rows += f"""
        <tr>
          <td>{item['item']}</td>
          <td>{desc_lines}<br><strong>Total:</strong></td>
          <td>{pkg_lines}<br><strong>{total_pkg}</strong></td>
          <td>{qty_lines}<br><strong>{total_qty}</strong></td>
        </tr>
        """
    else:
        # Fallback for older single-entry format
        rows += f"""
        <tr>
          <td>{item['item']}</td>
          <td>{item['desc']}</td>
          <td>{item['pkg']}</td>
          <td>{item['qty']}</td>
        </tr>
        """

# Add grand total rolls (packages) row only
grand_total_rolls = sum(
    len(item.get("pkg", [])) if isinstance(item.get("pkg"), list) else 1
    for item in data["items"]
)

rows += f"""
<tr style="background:#f9f9f9;">
  <td colspan="2" style="text-align: right; font-weight: bold;">Grand Total Packages:</td>
  <td><strong>{grand_total_rolls}</strong></td>
  <td></td>
</tr>
"""

html = html.replace("{{rows}}", rows)

# Output path
output_dir = os.path.join(os.getcwd(), "packing_slips")
os.makedirs(output_dir, exist_ok=True)
filename = f"packing_{data['invoice']}.pdf"
filepath = os.path.join(output_dir, filename)

print("----- HTML to Render -----")
print(html)
print("--------------------------")

# Generate PDF
options = {
    'enable-local-file-access': None,
    'quiet': ''
}
pdfkit.from_string(html, filepath, configuration=config, options=options)
# Open file/folder
try:
    os.startfile(filepath)
except Exception as e:
    print(f"Could not open: {e}")

print(filepath)
