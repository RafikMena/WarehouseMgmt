window.moduleInit = () => {
  const itemCodeInput = document.getElementById('itemCode');
  const packingInput = document.getElementById('packing');
  const yardsInput = document.getElementById('yards');
  const resultDiv = document.getElementById('result');
  const addBtn = document.getElementById('addBtn');

  if (!itemCodeInput || !packingInput || !yardsInput || !resultDiv || !addBtn) {
    console.warn('❌ add.js: Required DOM elements not found.');
    return;
  }

addBtn.onclick = async () => {
  const itemCode = itemCodeInput.value.trim();
  const packing = parseInt(packingInput.value);
  const rawYards = parseFloat(yardsInput.value);

  // Round UP to nearest hundredth
  const yards = isNaN(rawYards) ? NaN : Math.ceil(rawYards * 100) / 100;

  if (!itemCode || isNaN(packing) || isNaN(yards)) {
    resultDiv.innerHTML = `<div style="color: red;">⚠️ Please fill in all fields correctly.</div>`;
    itemCodeInput.focus();
    return;
  }

  await window.api.addRoll({ itemCode, packing, yards });

  resultDiv.innerHTML = `
    <div style="color: green;">
      ✅ Added <strong>${packing}</strong> roll${packing !== 1 ? 's' : ''} 
      (<strong>${yards.toFixed(2)}</strong> yards) to <strong>${itemCode}</strong>
    </div>
  `;

  itemCodeInput.value = '';
  packingInput.value = '';
  yardsInput.value = '';
  itemCodeInput.focus();
};

};
