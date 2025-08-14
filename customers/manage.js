window.moduleInit = async () => {
  const nameInput = document.getElementById('newCustomer');
  const addressInput = document.getElementById('newAddress');
  const addBtn = document.getElementById('addCustomerBtn');
  const addStatus = document.getElementById('addStatus');
  const shipToContainer = document.getElementById('shipToInputs');
  const addShipToBtn = document.getElementById('addShipToBtn');

  function addShipToField(value = '') {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'shipToField';
    input.value = value;
    input.placeholder = 'Ship To Address';
    input.style = 'width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 6px;';
    shipToContainer.appendChild(input);
  }

  window.addShipToField = addShipToField;

  function restoreFocusAfterPrompt(focusTarget) {
    setTimeout(() => focusTarget.focus(), 100);
  }

  addShipToBtn.onclick = () => addShipToField();

addBtn.onclick = async () => {
  const name = nameInput.value.trim();
  const address = addressInput.value.trim();

  // Safely extract string values only
  const shipTos = Array.from(document.querySelectorAll('.shipToField'))
    .map(el => typeof el.value === 'string' ? el.value.trim() : '')
    .filter(Boolean); // remove empty

  if (!name || !address) {
    addStatus.innerHTML = `<span style="color:red;">⚠️ Please fill all fields.</span>`;
    restoreFocusAfterPrompt(!name ? nameInput : addressInput);
    return;
  }

  const safePayload = JSON.parse(JSON.stringify({ name, address, shipTos }));

  try {
    await window.customerAPI.addCustomer(safePayload);
    addStatus.innerHTML = `<span style="color:green;">✅ Customer added.</span>`;
    nameInput.value = '';
    addressInput.value = '';
    shipToContainer.innerHTML = '';
    restoreFocusAfterPrompt(nameInput);
  } catch (err) {
    console.error('❌ Failed to add customer:', err);
    addStatus.innerHTML = `<span style="color:red;">Error adding customer.</span>`;
  }
};


  addShipToField(); // Auto-add first field
};
