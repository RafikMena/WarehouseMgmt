// db.js
const { JSONFileSync, LowSync } = require('lowdb');
const path = require('path');
const fs = require('fs');

const file = path.join(__dirname, 'data', 'db.json');
const defaultData = { items: [],
  packingSlips: [] }; // ✅ use "items" for consistency

if (!fs.existsSync(path.dirname(file))) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
}

const adapter = new JSONFileSync(file);
const db = new LowSync(adapter);
db.read();
db.data ||= defaultData;

module.exports = db;
