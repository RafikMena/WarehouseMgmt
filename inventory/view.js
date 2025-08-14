let allItems = [];
let currentEditItem = null;
let currentDeleteCode = null;

// Round UP to the nearest hundredth
const ceil2 = (n) => Math.ceil(n * 100) / 100;

function openEditModal(code) {
  currentEditItem = code;
  const item = allItems.find(i => i.itemCode === code);
  if (!item) return;

  document.getElementById('editCode').value = item.itemCode;
  document.getElementById('editPacking').value = item.packing;

  // Always show two decimals in the input
  const y = Number(item.yards);
  document.getElementById('editYards').value = Number.isFinite(y) ? y.toFixed(2) : '';
  document.getElementById('editModal').style.display = 'flex';
}

function saveEdit() {
  const packing = parseInt(document.getElementById('editPacking').value);
  const rawYards = parseFloat(document.getElementById('editYards').value);
  const yards = Number.isFinite(rawYards) ? ceil2(rawYards) : NaN;

  const item = allItems.find(i => i.itemCode === currentEditItem);
  if (item) {
    item.packing = packing;
    item.yards = yards; // store as number, rounded up
  }

  window.api.saveInventory(allItems).then(() => {
    closeModal();
    renderInventory(allItems);
  });
}

function openDeleteModal(code) {
  currentDeleteCode = code;
  document.getElementById('deleteText').textContent = `Are you sure you want to delete "${code}"?`;
  document.getElementById('deleteModal').style.display = 'flex';
}

function confirmDelete() {
  allItems = allItems.filter(i => i.itemCode !== currentDeleteCode);
  window.api.saveInventory(allItems).then(() => {
    closeModal();
    renderInventory(allItems);
  });
}

function closeModal() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('deleteModal').style.display = 'none';
}

window.moduleInit = async () => {
  const searchInput = document.getElementById('search');
  const inventoryContainer = document.getElementById('inventory') || document.getElementById('inventoryTable').parentElement;

  if (!searchInput || !inventoryContainer) {
    console.warn('❌ Missing #search or #inventory elements in view.html');
    return;
  }

  allItems = await window.api.getRolls();
  renderInventory(allItems);

  searchInput.oninput = () => {
    const query = searchInput.value.toLowerCase();
    const filtered = allItems.filter(item =>
      item.itemCode.toLowerCase().includes(query)
    );
    renderInventory(filtered);
  };
};

function renderInventory(data) {
  const tbody = document.getElementById('inventoryBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  data.forEach((item) => {
    const y = Number(item.yards);
    const yardsDisplay = Number(item.yards).toFixed(2);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.itemCode}</td>
      <td>${item.packing}</td>
      <td>${yardsDisplay}</td>
      <td>
        <button class="edit-btn" data-code="${item.itemCode}" style="font-size:11px;padding:2px 6px;">✏️</button>
        <button class="delete-btn" data-code="${item.itemCode}" style="font-size:11px;padding:2px 6px;">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => openEditModal(btn.dataset.code);
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => openDeleteModal(btn.dataset.code);
  });

  if (data.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'No results found.';
    cell.style.textAlign = 'center';
    row.appendChild(cell);
    tbody.appendChild(row);
  }
}

function exportInventoryToCSV(inventory) {
  const headers = ['Item Code', 'Rolls', 'Yards'];
  const rows = inventory.map(item => {
    const y = Number(item.yards);
    return [item.itemCode, item.packing, Number.isFinite(y) ? y.toFixed(2) : ''];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.download = `inventory_export_${timestamp}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportInventoryToExcel(inventory) {
  const worksheetData = inventory.map(item => {
    const y = Number(item.yards);
    // Store as a number rounded to 2 decimals so Excel treats it as numeric
    const yNum = Number.isFinite(y) ? Number(y.toFixed(2)) : '';
    return {
      "Item Code": item.itemCode,
      "Rolls": item.packing,
      "Yards": yNum
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.href = url;
  link.download = `inventory_export_${timestamp}.xlsx`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
  exportBtn.onclick = async () => {
    const inventory = await window.api.getInventory();
    exportInventoryToCSV(inventory);
  };
}

window.saveEdit = saveEdit;
window.closeModal = closeModal;
window.confirmDelete = confirmDelete;
