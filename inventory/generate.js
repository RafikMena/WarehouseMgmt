window.moduleInit = () => {
  const itemInput = document.getElementById('itemInput');
  const yardsInput = document.getElementById('yardsInput');
  const rollInput = document.getElementById('rollInput');
  const genBtn = document.getElementById('genBtn');
  const status = document.getElementById('status');

  const barcodeList = [];
  const listEl = document.createElement('ul');
  listEl.id = 'barcodeList';
  listEl.style.margin = '20px 0';
  listEl.style.paddingLeft = '20px';
  status.parentNode.insertBefore(listEl, status);

  const addToListBtn = document.createElement('button');
  addToListBtn.textContent = '➕ Add to List';
  addToListBtn.style.marginTop = '10px';
  itemInput.parentNode.insertBefore(addToListBtn, genBtn);

  addToListBtn.onclick = () => {
    const item = itemInput.value.trim();
    const yards = yardsInput.value.trim();
    const roll = rollInput.value.trim();

    if (!item || !yards) {
      status.innerHTML = `<span style="color:red;">⚠️ Item and Yards required.</span>`;
      return;
    }

    if (barcodeList.length >= 10) {
      status.innerHTML = `<span style="color:red;">⚠️ Limit of 10 barcodes per sheet.</span>`;
      return;
    }

    const finalRoll = (roll && roll !== "0") ? roll : Math.floor(Math.random() * 200 + 1).toString();
    const barcodeStr = `${finalRoll}|${item}|${yards}`;
    barcodeList.push(barcodeStr);

    const li = document.createElement('li');
    li.textContent = barcodeStr;
    listEl.appendChild(li);

    itemInput.value = '';
    yardsInput.value = '';
    rollInput.value = '';
    status.innerHTML = '';
  };

  genBtn.onclick = async () => {
    if (barcodeList.length === 0) {
      status.innerHTML = `<span style="color:red;">⚠️ Add at least one barcode.</span>`;
      return;
    }

    try {
      await window.api.generateBarcodeSheet(barcodeList);
      status.innerHTML = `<span style="color:green;">✅ Barcode sheet generated and opened.</span>`;
      barcodeList.length = 0;
      listEl.innerHTML = '';
    } catch (e) {
      console.error(e);
      status.innerHTML = `<span style="color:red;">❌ Failed to generate barcode sheet.</span>`;
    }
  };
};
