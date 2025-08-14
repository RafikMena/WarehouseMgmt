require('dotenv').config();
const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { shell } = require('electron');

const mongoose = require('mongoose');
const Item = require('./models/Item');
const Customer = require('./models/Customer');
const PackingSlip = require('./models/PackingSlip');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Error:', err));

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('main.html');
  win.maximize();

  win.webContents.once('did-finish-load', () => {
    globalShortcut.register('Control+Shift+I', () => {
      win.webContents.toggleDevTools();
    });
  });
}

app.whenReady().then(createWindow);
app.on('will-quit', () => globalShortcut.unregisterAll());

// ==============================
// 🧵 INVENTORY
// ==============================

ipcMain.handle('get-rolls', async () => {
  const items = await Item.find().lean(); // ✅ FIXED: Ensure cloneable
  return items.map(i => ({
    itemCode: i.itemCode,
    packing: i.packing,
    yards: i.yards
  }));
});

ipcMain.handle('add-roll', async (_, entry) => {
  const { itemCode, packing, yards } = entry;
  const existing = await Item.findOne({ itemCode });

  if (existing) {
    existing.packing += packing;
    existing.yards += yards;
    await existing.save();
  } else {
    await new Item({ itemCode, packing, yards }).save();
  }

  return await Item.find().lean(); // ✅ FIXED
});

ipcMain.handle('delete-roll', async (_, { itemCode, yards }) => {
  const item = await Item.findOne({ itemCode });
  if (!item) return { status: 'not-found' };

  item.packing -= 1;
  item.yards -= Math.abs(parseFloat(yards));
  await item.save();

  return { status: 'updated', remaining: item.yards };
});

ipcMain.handle('delete-item-completely', async (_, itemCode) => {
  await Item.deleteMany({ itemCode, yards: 0 });
  console.log(`✅ Deleted item ${itemCode} from inventory if yards = 0`);
});

ipcMain.handle('get-inventory', async () => {
  return await Item.find().lean(); // ✅ FIXED
});

ipcMain.handle('save-inventory', async (_, items) => {
  await Item.deleteMany({});
  await Item.insertMany(items.map(i => ({
    itemCode: i.itemCode,
    packing: i.packing,
    yards: i.yards
  }))); // ✅ Make sure only raw objects are inserted
  return true;
});

// ==============================
// 👤 CUSTOMERS
// ==============================

ipcMain.handle('get-customers', async () => {
  return await Customer.find().lean(); // ✅
});

ipcMain.handle('add-customer', async (_, customer) => {
  const exists = await Customer.findOne({ name: customer.name });
  if (!exists) {
    await new Customer({
      name: customer.name,
      address: customer.address,
      shipTos: customer.shipTos || []
    }).save();
  }
  return await Customer.find().lean(); // ✅
});

ipcMain.handle('delete-customer', async (_, name) => {
  await Customer.deleteOne({ name });
  return await Customer.find().lean(); // ✅
});

ipcMain.handle('edit-customer', async (_, oldName, updatedCustomer) => {
  await Customer.updateOne({ name: oldName }, updatedCustomer);
  return await Customer.find().lean(); // ✅
});

// ==============================
// 📦 PACKING SLIPS
// ==============================

const tmpPath = path.join(__dirname, 'packing', 'tmp_packing.json');

ipcMain.handle('create-packing-slip', async (_, data) => {
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    const script = path.join(__dirname, 'packing', 'generate_packing_slip.py');

    return await new Promise((resolve, reject) => {
      execFile('python', [script, tmpPath], (err, stdout) => {
        if (err) {
          console.error('❌ Packing Slip Generation Error:', err);
          return reject(err);
        }
        console.log('✅ Packing Slip Generated');
        resolve('success');
      });
    });
  } catch (error) {
    console.error('❌ create-packing-slip failed:', error);
    throw error;
  }
});

ipcMain.handle('get-packing-slips', async () => {
  return await PackingSlip.find().sort({ createdAt: -1 }).lean(); // ✅ FIXED
});

ipcMain.handle('save-packing-slip', async (_, slip) => {
  const existing = await PackingSlip.findOne({ id: slip.id });

  if (existing) {
    await PackingSlip.updateOne({ id: slip.id }, slip);
  } else {
    await new PackingSlip(slip).save();
  }

  return slip; // Already plain
});

ipcMain.handle('delete-packing-slip', async (_, id) => {
  await PackingSlip.deleteOne({ id });
});

ipcMain.handle('get-last-invoice', async () => {
  const slips = await PackingSlip.find().lean(); // ✅ FIXED
  const nums = slips.map(slip => parseInt(slip.invoice)).filter(n => !isNaN(n));
  return Math.max(...nums, 0);
});

// ==============================
// 🧾 BARCODES
// ==============================

ipcMain.handle('generate-barcode', (_, item, yards, roll) => {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, 'inventory', 'generate_barcode.py');
    const args = [script, item, yards];
    if (roll) args.push(roll);

    execFile('python', args, (err, stdout) => {
      if (err) {
        console.error('❌ Barcode generation error:', err);
        return reject(err);
      }

      const lines = stdout.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      console.log('✅ Barcode generated:', lastLine);
      shell.openPath(lastLine).then(() => resolve('success'));
    });
  });
});

ipcMain.handle('generateBarcodeSheet', async (_, barcodeList) => {
  return new Promise((resolve, reject) => {
    const tempPath = path.join(app.getPath('temp'), 'barcodes.json');
    fs.writeFileSync(tempPath, JSON.stringify(barcodeList));

    const script = path.join(__dirname, 'inventory', 'generate_barcode.py');
    execFile('python', [script, tempPath], (err, stdout) => {
      if (err) {
        console.error('❌ Barcode sheet generation error:', err);
        return reject(err);
      }

      const lines = stdout.toString().trim().split('\n');
      const outputPath = lines[lines.length - 1];
      console.log('✅ Sheet generated:', outputPath);
      shell.openPath(outputPath).then(() => resolve('success'));
    });
  });
});

// ==============================
// 🖥️ WINDOW CONTROLS
// ==============================

ipcMain.on('minimize', () => BrowserWindow.getFocusedWindow().minimize());
ipcMain.on('maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.on('close', () => BrowserWindow.getFocusedWindow().close());
