const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  addRoll: (roll) => ipcRenderer.invoke('add-roll', roll),
  getRolls: () => ipcRenderer.invoke('get-rolls'),
  deleteRoll: (rollObj) => ipcRenderer.invoke('delete-roll', rollObj),
  generateBarcodeSheet: (barcodes) => ipcRenderer.invoke('generateBarcodeSheet', barcodes),
  createPackingSlip: (data) => ipcRenderer.invoke('create-packing-slip', data),
  getLastInvoice: () => ipcRenderer.invoke('get-last-invoice'),
  deleteItemCompletely: (itemCode) => ipcRenderer.invoke('delete-item-completely', itemCode),
  getInventory: () => ipcRenderer.invoke('get-inventory'),
  saveInventory: (items) => ipcRenderer.invoke('save-inventory', items),
});

contextBridge.exposeInMainWorld('customerAPI', {
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  addCustomer: (customer) => ipcRenderer.invoke('add-customer', customer),
  editCustomer: (oldName, updatedCustomer) => ipcRenderer.invoke('edit-customer', oldName, updatedCustomer),
  deleteCustomer: (name) => ipcRenderer.invoke('delete-customer', name)
});

contextBridge.exposeInMainWorld('packingAPI', {
  getAllSlips: () => ipcRenderer.invoke('get-packing-slips'),
  saveSlip: (slip) => ipcRenderer.invoke('save-packing-slip', slip),
  deleteSlip: (id) => ipcRenderer.invoke('delete-packing-slip', id),
});

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close')
});

contextBridge.exposeInMainWorld('nav', {
  go: (page) => ipcRenderer.send('navigate-to', page),
});
