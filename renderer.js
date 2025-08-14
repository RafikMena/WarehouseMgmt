async function addEntry() {
  const itemCode = document.getElementById('itemCode').value.trim();
  const packing = parseInt(document.getElementById('packing').value);
  const yards = parseFloat(document.getElementById('yards').value);

  if (!itemCode || isNaN(packing) || isNaN(yards)) {
    alert('Please fill in all fields');
    return;
  }

  const entry = { itemCode, packing, yards };
  const updatedItems = await window.api.addRoll(entry);
  displayInventory(updatedItems);

  document.getElementById('itemCode').value = '';
  document.getElementById('packing').value = '';
  document.getElementById('yards').value = '';
}

async function loadInventory() {
  const items = await window.api.getRolls();
  displayInventory(items);
}

function displayInventory(items) {
  const container = document.getElementById('inventory');
  container.innerHTML = '';

  items.forEach((e) => {
    container.innerHTML += `
      <div class="entry">
        <strong>${e.itemCode}</strong> | Rolls: ${e.packing} | Yards: ${e.yards}
      </div>`;
  });
}

window.onload = loadInventory;
