const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/views/MenuView.vue');
let code = fs.readFileSync(filePath, 'utf-8');

// 1. Inject UI for Addons
const addonUI = `
          <div v-if="item.addonList && item.addonList.length > 0" class="addons-container">
            <p class="addons-title">Customize:</p>
            <div v-for="addon in item.addonList" :key="addon.id" class="addon-check">
              <input type="checkbox" :id="'addon-'+item.id+'-'+addon.id" :value="addon" v-model="item.selectedAddOnsLocal" />
              <label :for="'addon-'+item.id+'-'+addon.id" style="cursor: pointer;">{{ addon.name }} (+₹{{ addon.price }})</label>
            </div>
          </div>
          
          <div class="menu-card-footer">`;

code = code.replace(`<div class="menu-card-footer">`, addonUI);

// 2. Initialise `selectedAddOnsLocal` array for items
code = code.replace(
  `menuItems.value = await response.json()`,
  `const data = await response.json()\n    menuItems.value = data.map(item => ({ ...item, selectedAddOnsLocal: [] }))`
);

// 3. Update addToCart Logic
code = code.replace(
  `const addToCart = (item) => {
  // Pass the item to the cart store
  cartStore.addToCart(item, [], 1)`,
  `const addToCart = (item) => {
  const selected = [...(item.selectedAddOnsLocal || [])]
  cartStore.addToCart(item, selected, 1)
  item.selectedAddOnsLocal = []`
);

// 4. Inject CSS
const addonCSS = `
.addons-container {
  margin-bottom: 16px;
  background: rgba(0,0,0,0.02);
  padding: 12px;
  border-radius: 12px;
}
.addons-title { font-size: 0.9rem; font-weight: bold; margin-bottom: 8px; color: var(--text-main); }
.addon-check { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 0.9rem; color: var(--text-muted); }
.addon-check input { accent-color: var(--brand-primary); cursor: pointer;}
.menu-item-price { font-weight: 800; font-size: 1.25rem; color: var(--text-main); }`;

code = code.replace(`.menu-item-price { font-weight: 800; font-size: 1.25rem; color: var(--text-main); }`, addonCSS);

fs.writeFileSync(filePath, code);
console.log('MENU PATCH SUCCESS');