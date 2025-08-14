window.moduleInit = async () => {
  const nameInput = document.getElementById('newCustomer');
  const addressInput = document.getElementById('newAddress');
  const shipTosInput = document.getElementById('newShipTos');
  const addBtn = document.getElementById('addCustomerBtn');
  const addStatus = document.getElementById('addStatus');
  const searchInput = document.getElementById('searchCustomer');
  const resultsDiv = document.getElementById('searchResults');

  async function renderSearchResults(query = '') {
    const customers = await window.customerAPI.getCustomers();
    const filtered = customers.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );

    resultsDiv.innerHTML = '';

    filtered.forEach(c => {
      const div = document.createElement('div');
      div.className = 'entry';

      const shipTosText = (c.shipTos || []).join('\n');

      div.innerHTML = `
        <input type="text" class="edit-name" value="${c.name}" placeholder="Customer Name" />
        <input type="text" class="edit-address" value="${c.address}" placeholder="Billing Address" />
        <textarea class="edit-shiptos" rows="2" placeholder="Ship To addresses (one per line)">${shipTosText}</textarea>
        <div class="entry-buttons">
          <button class="save-btn">💾</button>
          <button class="delete-btn">🗑️</button>
        </div>
      `;

      div.querySelector('.save-btn').onclick = async () => {
        const newName = div.querySelector('.edit-name').value.trim();
        const newAddress = div.querySelector('.edit-address').value.trim();
        const newShipTos = div.querySelector('.edit-shiptos').value
          .split('\n')
          .map(line => line.trim())
          .filter(line => line);

        if (!newName || !newAddress) {
          alert('⚠️ Name and address required.');
          return;
        }

        await window.customerAPI.editCustomer(c.name, {
          name: newName,
          address: newAddress,
          shipTos: newShipTos,
        });
        renderSearchResults(searchInput.value);
      };

      div.querySelector('.delete-btn').onclick = async () => {
        if (confirm(`Delete ${c.name}?`)) {
          await window.customerAPI.deleteCustomer(c.name);
          renderSearchResults(searchInput.value);
        }
      };

      resultsDiv.appendChild(div);
    });
  }

  addBtn.onclick = async () => {
    const name = nameInput.value.trim();
    const address = addressInput.value.trim();
    const shipTos = shipTosInput.value.trim().split('\n').filter(l => l.trim());

    if (!name || !address) {
      addStatus.innerHTML = `<span style="color:red;">⚠️ Please fill all fields.</span>`;
      return;
    }

    await window.customerAPI.addCustomer({ name, address, shipTos });

    addStatus.innerHTML = `<span style="color:green;">✅ Customer added.</span>`;
    nameInput.value = '';
    addressInput.value = '';
    shipTosInput.value = '';
    renderSearchResults(searchInput.value);
  };

  searchInput.oninput = () => {
    renderSearchResults(searchInput.value);
  };

  renderSearchResults();
};