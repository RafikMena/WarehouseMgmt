window.onload = () => {
    document.getElementById('generateBtn').onclick = async function () {
      const roll = document.getElementById('rollInput').value.trim();
      const item = document.getElementById('itemInput').value.trim();
      const yards = document.getElementById('yardsInput').value.trim();
      const preview = document.getElementById('barcode-preview');
  
      if (!roll || !item || !yards) {
        preview.innerHTML = `<div style="color:red;">Please fill in all fields.</div>`;
        return;
      }
  
      const encodedText = `${roll},${item},${yards}`;
      const canvas = document.createElement('canvas');
  
      try {
        console.log('📦 Barcode Text:', encodedText);
        canvas.width = 400;
        canvas.height = 100;

        // ✅ Use bwip-js to draw barcode
        bwipjs.toCanvas(canvas, {
          bcid: 'code128',
          text: encodedText,
          scale: 3,
          height: 10,
          includetext: true,
          textxalign: 'center',
        });
  
        // ✅ Show preview
        preview.innerHTML = `
          <div style="margin-top: 20px;">
            <strong>Encoded:</strong> ${encodedText}
            <div style="margin-top: 10px;">${canvas.outerHTML}</div>
            <button onclick="window.print()">🖨️ Print Barcode</button>
          </div>
        `;
  
        // Clear fields
        document.getElementById('rollInput').value = '';
        document.getElementById('itemInput').value = '';
        document.getElementById('yardsInput').value = '';
      } catch (err) {
        console.error('❌ Barcode generation failed:', err);
        preview.innerHTML = `<div style="color:red;">Failed to generate barcode.</div>`;
      }
    };

    window.downloadBarcode = function() {
        const canvas = document.querySelector('#barcode-preview canvas');
        const link = document.createElement('a');
        link.download = 'barcode.png';
        link.href = canvas.toDataURL();
        link.click();
      }
      
  };
  