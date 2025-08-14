const mainView = document.getElementById('mainView');
const tabs = document.querySelectorAll('.tab');

const pageMap = {
  inventory: './inventory/view.html',
  add: './inventory/add.html',
  manage: './customers/manage.html',
  lookup: './customers/lookup.html',
  packing: './packing/packing.html',
  barcode: './inventory/generate.html',
};

const scriptMap = {
  './inventory/view.html': './inventory/view.js',
  './inventory/add.html': './inventory/add.js',
  './inventory/generate.html': './inventory/generate.js',
  './customers/manage.html': './customers/manage.js',
  './customers/lookup.html': './customers/lookup.js', 
  './packing/packing.html': './packing/packing.js',
};

function setActive(tabName) {
  tabs.forEach(tab => {
    if (tab.textContent.toLowerCase().includes(tabName)) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

export async function navigate(section) {
  document.getElementById('minBtn').onclick = () => window.windowControls.minimize();
  document.getElementById('maxBtn').onclick = () => window.windowControls.maximize();
  document.getElementById('closeBtn').onclick = () => window.windowControls.close();
    setActive(section);
  
    if (typeof window.beforeUnloadPacking === 'function') {
      await window.beforeUnloadPacking(); // Save before unloading
      delete window.beforeUnloadPacking;  // Clean up
    }
    
    const page = pageMap[section];
    const scriptPath = scriptMap[page];
  
    fetch(page)
      .then(res => res.text())
      .then(html => {
        mainView.innerHTML = html;
  
        // 🧼 Clean up previous moduleInit and script tags
        delete window.moduleInit;
        document.querySelectorAll('script[data-page]').forEach(s => s.remove());
  
        if (scriptPath) {
          // 🔁 Force reload by changing URL (add timestamp)
          const script = document.createElement('script');
          script.type = 'module';
          script.src = `${scriptPath}?v=${Date.now()}`;
          script.setAttribute('data-page', page);
  
          script.onload = () => {
            if (typeof window.moduleInit === 'function') {
              window.moduleInit();
            } else {
              console.error(`❌ No moduleInit() found in ${scriptPath}`);
            }
          };
  
          document.body.appendChild(script);
        }
      })
      .catch(err => {
        mainView.innerHTML = `<div style="color:red;">❌ Failed to load ${page}</div>`;
        console.error(err);
      });
  }
  

// Expose navigate globally
window.navigate = navigate;

// Load default section
navigate('inventory');
