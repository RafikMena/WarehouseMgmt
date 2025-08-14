window.moduleInit = async () => {
  const nameInput = document.getElementById('newCustomer');
  const addressInput = document.getElementById('newAddress');
  const addBtn = document.getElementById('addCustomerBtn');
  const addStatus = document.getElementById('addStatus');
  const shipToContainer = document.getElementById('shipToInputs');
  const addShipToBtn = document.getElementById('addShipToBtn');


  const clearBtn = document.getElementById('clearFormBtn') || document.querySelector('.btn-grey[type="reset"]');

    clearBtn.onclick = () => {
      nameInput.value = '';
      addressInput.value = '';
      shipToContainer.innerHTML = '';
      addShipToField(); // re-add empty Ship To
      addStatus.innerHTML = '';
      restoreFocusAfterPrompt(nameInput);
    };

  function addShipToField(value = '') {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'shipToField qb-input';
    input.value = value;
    input.placeholder = 'Ship To Address';
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

  const shipTos = Array.from(document.querySelectorAll('.shipToField'))
    .map(el => (typeof el.value === 'string' ? el.value.trim() : ''))
    .filter(Boolean);

  if (!name || !address) {
    addStatus.innerHTML = `<span style="color:red;">⚠️ Please fill all fields.</span>`;
    restoreFocusAfterPrompt(!name ? nameInput : addressInput);
    return;
  }

  const safePayload = { name, address, shipTos };

  try {
    await window.customerAPI.addCustomer(safePayload);
    addStatus.innerHTML = `<span style="color:green;">✅ Customer added.</span>`;

    // ✅ Reset form
    nameInput.value = '';
    addressInput.value = '';
    shipToContainer.innerHTML = '';
    addShipToField(); // re-add empty Ship To

    restoreFocusAfterPrompt(nameInput);

    // Optional: clear status after a short delay
    setTimeout(() => { addStatus.innerHTML = ''; }, 2000);

  } catch (err) {
    console.error('❌ Failed to add customer:', err);
    addStatus.innerHTML = `<span style="color:red;">Error adding customer.</span>`;
  }
};


  // Auto-add first Ship To field
  addShipToField();
};
