function addShipToField(value = '') {
  const container = document.getElementById('shipToInputs');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'shipToField';
  input.value = value;
  input.placeholder = 'Ship To Address';
  input.style = 'width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 6px;';
  container.appendChild(input);
}

window.addShipToField = addShipToField;

async function showConfirm(message) {
  return new Promise(resolve => {
    const modal = document.getElementById('confirmModal');
    const msg = document.getElementById('confirmMessage');
    const yes = document.getElementById('confirmYesBtn');
    const no = document.getElementById('confirmNoBtn');

    msg.textContent = message;
    modal.style.display = 'flex'; // show the modal centered

    yes.onclick = () => {
      modal.style.display = 'none'; // hide after click
      resolve(true);
    };

    no.onclick = () => {
      modal.style.display = 'none'; // hide after click
      resolve(false);
    };
  });
}


window.moduleInit = async () => {
  const input = document.getElementById('searchCustomer');
  const results = document.getElementById('results');
  const modal = document.getElementById('editModal');
  const editName = document.getElementById('editName');
  const editAddress = document.getElementById('editAddress');
  const saveEditBtn = document.getElementById('saveEditBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');

  let currentCustomer = null;

  function populateEditModal(customer) {
    editName.value = customer.name;
    editAddress.value = customer.address;

    const container = document.getElementById('shipToInputs');
    container.innerHTML = '';
    (Array.isArray(customer.shipTos) ? customer.shipTos : []).forEach(addr => addShipToField(addr));
  }

  function showModal(customer) {
    currentCustomer = customer;
    populateEditModal(customer);
    modal.style.display = 'flex';
  }

  function closeModal() {
    modal.style.display = 'none';
    currentCustomer = null;
  }

  async function render() {
  const query = input.value.toLowerCase();
  const customers = await window.customerAPI.getCustomers();
  const filtered = customers.filter(c => c.name.toLowerCase().includes(query));

  results.innerHTML = ''; // results is the <tbody>

  filtered.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.address || ''}</td>
      <td style="text-align:center;">
        ${(Array.isArray(c.shipTos) ? c.shipTos.length : 0)}
      </td>
      <td class="customer-actions">
        <button class="edit-btn" data-name="${c.name}">✏️ Edit</button>
        <button class="delete-btn" data-name="${c.name}">🗑️ Delete</button>
      </td>
    `;
    results.appendChild(tr);
  });

  // event bindings
  results.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => {
      const customer = filtered.find(c => c.name === btn.dataset.name);
      if (customer) showModal(customer);
    };
  });

  results.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = async () => {
      const confirmed = await showConfirm(`Are you sure you want to delete ${btn.dataset.name}?`);
      if (confirmed) {
        await window.customerAPI.deleteCustomer(btn.dataset.name);
        render();
      }
    };
  });
}


  saveEditBtn.onclick = async () => {
    if (!currentCustomer) return;

    const updated = {
      name: editName.value.trim(),
      address: editAddress.value.trim(),
      shipTos: Array.from(document.querySelectorAll('.shipToField'))
        .map(input => input.value.trim())
        .filter(Boolean)
    };

    await window.customerAPI.editCustomer(currentCustomer.name, updated);
    closeModal();
    render();
  };

  closeModalBtn.onclick = closeModal;
  input.oninput = render;
  render();
};
