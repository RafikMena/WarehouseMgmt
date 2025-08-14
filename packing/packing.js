let scannedItems = [];
let warningTimer = null;
let currentSlipId = null;
let currentSlipVoided = false; 

function showWarning(message) {
  const warningBox = document.getElementById('scan-warnings');
  warningBox.innerText = message;
  warningBox.style.display = 'block';

  if (warningTimer) clearTimeout(warningTimer);
  warningTimer = setTimeout(() => {
    warningBox.style.display = 'none';
  }, 5000);
}

function clearWarning() {
  const warningBox = document.getElementById('scan-warnings');
  warningBox.style.display = 'none';
  if (warningTimer) clearTimeout(warningTimer);
}

let isDirty = false;


async function showConfirm(message) {
  return new Promise(resolve => {
    const modal = document.getElementById('confirmModal');
    const msg = document.getElementById('confirmMessage');
    const yes = document.getElementById('confirmYesBtn');
    const no = document.getElementById('confirmNoBtn');

    msg.textContent = message;
    modal.style.display = 'flex';

    yes.onclick = () => {
      modal.style.display = 'none';
      resolve(true);
    };

    no.onclick = () => {
      modal.style.display = 'none';
      resolve(false);
    };
  });
}

function renderTable() {
  const tbody = document.getElementById('itemBody');
  tbody.innerHTML = '';

  const grouped = {};

  scannedItems.forEach((item, index) => {
    if (!grouped[item.itemCode]) {
      grouped[item.itemCode] = [];
    }
    grouped[item.itemCode].push({ ...item, index });
  });

  Object.entries(grouped).forEach(([itemCode, group]) => {
    const row = document.createElement('tr');

    const rollLines = group
      .map(i => {
        let warning = '';
        if (i.warning) {
          warning = ` <span style="color: orange; font-size: 0.8rem;">⚠️ (${i.warning})</span>`;
        }

        return `
          Roll #${i.roll}${warning}
          <button onclick="window.removeLine(${i.index})"
            style="margin-left:6px; font-size:10px; padding:2px 6px; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer;">
            ✕
          </button>
        `;
      })
      .join('<br>');

    const pkgLines = group.map(() => '1').join('<br>');
    const qtyLines = group.map(i => i.qty).join('<br>');

    const totalPkg = group.length;
    const totalQty = group.reduce((sum, i) => sum + i.qty, 0);

    row.innerHTML = `
      <td>${itemCode}</td>
      <td>${rollLines}<br></td>
      <td>${pkgLines}<br><strong>${totalPkg}</strong></td>
      <td>${qtyLines}<br><strong>${totalQty}</strong></td>
      <td></td>
    `;
    tbody.appendChild(row);
  });

  if (scannedItems.length > 0) {
    const totalRolls = scannedItems.length;

    const summaryRow = document.createElement('tr');
    summaryRow.style.background = '#f9f9f9';
    summaryRow.innerHTML = `
      <td colspan="2" style="text-align: right; font-weight: bold;">Total:</td>
      <td><strong>${totalRolls}</strong></td>
      <td></td>
    `;
    tbody.appendChild(summaryRow);
  }
}



function fillCustomerAddress() {
  const select = document.getElementById('customerSelect');
  const billTo = select.options[select.selectedIndex]?.dataset?.billTo || '';
  const shipTos = JSON.parse(select.options[select.selectedIndex]?.dataset?.shipTos || '[]');

  document.getElementById('billTo').value = billTo;
  isDirty = true;
  const shipToSelect = document.getElementById('shipToSelect');
  shipToSelect.innerHTML = `<option value="">-- Select Ship To Address --</option>`;
  shipTos.forEach(addr => {
    const opt = document.createElement('option');
    opt.value = addr;
    opt.textContent = addr;
    shipToSelect.appendChild(opt);
  });
  document.getElementById('shipTo').value = '';
}

document.getElementById('shipToSelect').onchange = function () {
  document.getElementById('shipTo').value = this.value;
  isDirty = true;
};

async function handleScan(e) {
  if (e.key !== 'Enter') return;
  const raw = e.target.value.trim();
  e.target.value = '';

  const parts = raw.split(',');
  if (parts.length !== 3) {
    document.getElementById('status').textContent = '❌ Invalid barcode format';
    restoreFocusAfterPrompt('barcodeInput');
    return;
  }

  const [itemCode, roll, yards] = parts;
  const qty = parseFloat(yards);

  let warning = '';

  const res = await window.api.deleteRoll({ itemCode, yards: qty });

  if (res.status === 'not-found') {
    warning = 'item not found';
    await window.api.addRoll({ itemCode, packing: -1, yards: -qty });
  } 
  else {
    const inventory = await window.api.getInventory();
    const foundItem = inventory.find(i => i.itemCode === itemCode);

    if (foundItem && foundItem.yards < 0) {
      warning = 'yards over inventory';
    }

    if (res.remaining === 0) {
      await window.api.deleteItemCompletely(itemCode);
    }
  }

  scannedItems.push({
    roll,
    itemCode,
    description: `Roll #${roll}`,
    package: 1,
    qty,
    warning
  });

  isDirty = true;
  renderTable();
  document.getElementById('status').textContent = '';
}


window.removeLine = async function (index) {
  const item = scannedItems[index];

  await window.api.addRoll({ itemCode: item.itemCode, packing: 1, yards: item.qty });

  const inventory = await window.api.getInventory();
  const foundItem = inventory.find(i => i.itemCode === item.itemCode);

  if (foundItem && foundItem.yards === 0) {
    await window.api.deleteItemCompletely(item.itemCode);
  }

  scannedItems.splice(index, 1);
  renderTable();
  isDirty = true;
};


async function generatePDF() {
  const grouped = {};
  scannedItems.forEach(item => {
    if (!grouped[item.itemCode]) {
      grouped[item.itemCode] = { item: item.itemCode, desc: [], pkg: [], qty: [] };
    }
    grouped[item.itemCode].desc.push(`Roll #${item.roll}`);
    grouped[item.itemCode].pkg.push(1);
    grouped[item.itemCode].qty.push(item.qty);
  });

  const groupedList = Object.values(grouped);

  const data = {
    customer: document.getElementById('customerSelect').value,
    invoice: document.getElementById('invoiceInput').value,
    billTo: document.getElementById('billTo').value,
    shipTo: document.getElementById('shipTo').value,
    po: document.getElementById('poNumber').value,
    shipDate: document.getElementById('shipDate').value,
    date: document.getElementById('invoiceDate').value,
    items: JSON.parse(JSON.stringify(scannedItems)),  
    groupedItems: groupedList                       
  };

  if (!data.customer || !data.billTo || !data.shipTo || data.items.length === 0) {
    document.getElementById('result').innerHTML = `<span style="color:red;">⚠️ Fill all fields and scan at least one item.</span>`;
    restoreFocusAfterPrompt('barcodeInput');
    return;
  }

  await window.packingAPI.saveSlip({ ...data, id: data.invoice });
  isDirty = false;

  await window.api.createPackingSlip({
    ...data,
    items: groupedList
  });

  document.getElementById('result').innerHTML = `<span style="color:green;">✅ Packing Slip Generated</span>`;

 
  await loadSlipList();
  clearSlipForm();
}



async function loadCustomers() {
  const customers = await window.customerAPI.getCustomers();
  const select = document.getElementById('customerSelect');
  select.innerHTML = `<option value="">-- Select Customer --</option>`;
  customers.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    opt.dataset.billTo = c.address;
    opt.dataset.shipTos = JSON.stringify(c.shipTos || []);
    select.appendChild(opt);
  });
}


window.moduleInit = async () => {
  const invoiceInput = document.getElementById('invoiceInput');
  const barcodeInput = document.getElementById('barcodeInput');
  const generateBtn = document.getElementById('generateSlipBtn');
  const customerSelect = document.getElementById('customerSelect');
  const saveBtn = document.getElementById('saveSlipBtn'); 
  document.getElementById('saveNewSlipBtn').onclick = async () => {
    await saveSlip();
    await loadSlipList();
    clearSlipForm(); 
  };

  function restoreFocusAfterPrompt(inputId) {
    setTimeout(() => {
      const el = document.getElementById(inputId);
      if (el) el.focus();
    }, 100);
  }
  
  document.getElementById('deleteSlipBtn').onclick = async () => {
    if (!currentSlipId) {
      const status = document.getElementById('status');
      status.style.color = 'red';
      status.textContent = '⚠️ No slip selected to delete.';
      restoreFocusAfterPrompt('barcodeInput');
      return;
    }
  
    const confirmed = await showConfirm(`Are you sure you want to delete slip #${currentSlipId}?`);
    if (!confirmed) return;
  
    await window.packingAPI.deleteSlip(currentSlipId);
    await loadSlipList();
    clearSlipForm();
  
    document.getElementById('slipSearch').value = ''; 
    currentSlipId = null;
  
    restoreFocusAfterPrompt('barcodeInput');
  };
  
  

  if (!invoiceInput || !barcodeInput || !generateBtn || !customerSelect || !saveBtn) return;

  const invoiceValue = await window.api.getLastInvoice();
  invoiceInput.value = invoiceValue + 1;

  barcodeInput.addEventListener('keydown', handleScan);
  generateBtn.onclick = generatePDF;
  customerSelect.onchange = fillCustomerAddress;
  saveBtn.onclick = saveSlip; 


  await loadCustomers();
  await loadSlipList();     
  renderTable();
};

async function loadSlipList() {
  const list = await window.packingAPI.getAllSlips();
  const input = document.getElementById('slipSearch');
  const resultBox = document.getElementById('slipResults');

  input.oninput = () => {
    const query = input.value.toLowerCase().trim();
    resultBox.innerHTML = '';

    if (!query) return;

    const matches = list.filter(slip =>
      slip.customer.toLowerCase().includes(query) ||
      slip.invoice.toString().includes(query)
    );

    matches.forEach(slip => {
      const li = document.createElement('li');
      li.textContent = `${slip.invoice} — ${slip.customer}`;
      li.style.padding = '6px 12px';
      li.style.cursor = 'pointer';
      li.onmouseenter = () => li.style.backgroundColor = '#f1f1f1';
      li.onmouseleave = () => li.style.backgroundColor = 'white';
      li.onclick = () => {
        slipSearch.value = `${slip.invoice} — ${slip.customer || '(no customer)'}`;
        currentSlipId = slip.id; 
        slipResults.innerHTML = '';
        loadSlip(slip.id);
      };
      
      resultBox.appendChild(li);
    });
  };
}

async function clearSlipForm() {
  const next = await window.api.getLastInvoice();
  document.getElementById('invoiceInput').value = next + 1;
  document.getElementById('customerSelect').value = '';
  document.getElementById('billTo').value = '';
  document.getElementById('shipTo').value = '';
  document.getElementById('shipToSelect').innerHTML = `<option value="">-- Select Ship To Address --</option>`;
  document.getElementById('poNumber').value = '';
  document.getElementById('shipDate').value = '';
  document.getElementById('invoiceDate').value = '';
  scannedItems = [];
  renderTable();
  isDirty = false;
}

async function loadSlip(id) {
  const slips = await window.packingAPI.getAllSlips();
  const slip = slips.find(s => s.id === id);
  if (!slip) return;

  currentSlipId = slip.id;
  currentSlipVoided = !!slip.void;

  document.getElementById('invoiceInput').value = slip.invoice;
  document.getElementById('customerSelect').value = slip.customer;
  fillCustomerAddress();
  document.getElementById('billTo').value = slip.billTo;
  document.getElementById('shipTo').value = slip.shipTo;
  document.getElementById('poNumber').value = slip.po;
  document.getElementById('shipDate').value = slip.shipDate;
  document.getElementById('invoiceDate').value = slip.date;

  if (currentSlipVoided) {
    scannedItems = []; 
    document.getElementById('voidBanner').style.display = 'block'; 
    document.getElementById('barcodeInput').disabled = true;
    document.getElementById('generateSlipBtn').disabled = true;
    document.getElementById('saveSlipBtn').disabled = true;
  } else {
    scannedItems = slip.items || [];
    document.getElementById('voidBanner').style.display = 'none'; 
    document.getElementById('barcodeInput').disabled = false;
    document.getElementById('generateSlipBtn').disabled = false;
    document.getElementById('saveSlipBtn').disabled = false;
  }
  

  renderTable();
}


async function saveSlip() {
  const slip = {
    id: document.getElementById('invoiceInput').value,
    invoice: document.getElementById('invoiceInput').value,
    customer: document.getElementById('customerSelect').value,
    billTo: document.getElementById('billTo').value,
    shipTo: document.getElementById('shipTo').value,
    po: document.getElementById('poNumber').value,
    shipDate: document.getElementById('shipDate').value,
    date: document.getElementById('invoiceDate').value,
    items: scannedItems,
    void: currentSlipVoided || false   
  };
  await window.packingAPI.saveSlip(slip);
}


window.beforeUnloadPacking = async () => {
  if (isDirty) {
    await saveSlip();
    isDirty = false;
  }
};

window.voidSlip = async function () {
  if (!currentSlipId) return;
  const confirmed = await showConfirm(`Void slip #${currentSlipId}? This will return all rolls to inventory.`);
  if (!confirmed) return;

  for (const item of scannedItems) {
    await window.api.addRoll({ itemCode: item.itemCode, packing: 1, yards: item.qty });
  }

  const slips = await window.packingAPI.getAllSlips();
  const slip = slips.find(s => s.id === currentSlipId);
  if (!slip) return;
  slip.void = true;
  await window.packingAPI.saveSlip(slip);

  await loadSlip(currentSlipId);
  document.getElementById('status').innerHTML = '<span style="color:red; font-size:18px; font-weight:bold;">❌ This slip has been voided</span>';
};
