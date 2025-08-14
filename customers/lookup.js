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

window.moduleInit = async () => {
  const input = document.getElementById('searchCustomer');
  const results = document.getElementById('results');
  const modal = document.getElementById('editModal');
  const editName = document.getElementById('editName');
  const editAddress = document.getElementById('editAddress');
  const saveEditBtn = document.getElementById('saveEditBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const deleteCustomerBtn = document.getElementById('deleteCustomerBtn');

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
    modal.style.display = 'block';
  }

  function closeModal() {
    modal.style.display = 'none';
    currentCustomer = null;
  }

  async function render() {
    const query = input.value.toLowerCase();
    const customers = await window.customerAPI.getCustomers();
    const filtered = customers.filter(c => c.name.toLowerCase().includes(query));

    results.innerHTML = '';

    filtered.forEach(c => {
      const div = document.createElement('div');
      div.className = 'entry';
      div.innerHTML = `
        <strong>${c.name}</strong><br>
        <div>🏢 Bill To: ${c.address}</div>
        <div>🚚 Ship To:
          <ul>${(Array.isArray(c.shipTos) ? c.shipTos : []).map(addr => `<li>${addr}</li>`).join('')}</ul>
        </div>
        <div style="margin-top: 10px; display: flex; gap: 10px;">
          <button onclick="window.editCustomer('${c.name}')">✏️ Edit</button>
          <button class="delete-btn" data-name="${c.name}" style="background: #dc3545; color: white;">🗑️ Delete</button>
        </div>
      `;
      results.appendChild(div);

      div.querySelector('.delete-btn').onclick = async () => {
        const confirmed = await showConfirm(`Are you sure you want to delete ${c.name}?`);
        if (confirmed) {
          await window.customerAPI.deleteCustomer(c.name);
          render();
        }
      };
    });

    // ✅ Now placed outside loop
    window.editCustomer = name => {
      const customer = filtered.find(c => c.name === name);
      if (customer) showModal(customer);
    };
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

  deleteCustomerBtn.onclick = async () => {
    if (!currentCustomer) return;

    const confirmed = await showConfirm(`Are you sure you want to delete ${currentCustomer.name}?`);
    if (!confirmed) return;

    await window.customerAPI.deleteCustomer(currentCustomer.name);
    closeModal();
    render();
  };

  closeModalBtn.onclick = closeModal;
  input.oninput = render;
  render();
};
