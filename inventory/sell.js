window.moduleInit = () => {
  const scanInput = document.getElementById('scanInput');
  const scanBtn = document.getElementById('scanBtn');
  const resultDiv = document.getElementById('resultMessage');
  const status = document.getElementById('statusMessage');

  if (!scanInput || !scanBtn || !resultDiv || !status) {
    console.warn('❌ sell.js: Missing DOM elements.');
    return;
  }

  scanBtn.onclick = async () => {
    const scanned = scanInput.value.trim();
    if (!scanned.includes(',')) {
      status.textContent = '⚠️ Invalid barcode format';
      status.style.color = 'red';
      return;
    }

    const [roll, itemCode, yards] = scanned.split(',');

    const result = await window.api.deleteRoll({ itemCode, yards });

    if (result.status === 'updated') {
      resultDiv.innerHTML = `✅ Sold ${yards} yards of ${itemCode}. Remaining: ${result.remaining} yards.`;
    } else if (result.status === 'deleted') {
      resultDiv.innerHTML = `🗑️ Sold ${yards} yards of ${itemCode}. Item fully removed.`;
    } else {
      resultDiv.innerHTML = `❌ Item not found in inventory.`;
    }

    status.textContent = '✅ Processed';
    status.style.color = 'green';
    scanInput.value = '';
  };
};
