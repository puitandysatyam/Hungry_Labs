import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    // Load from local storage initially
    items: JSON.parse(localStorage.getItem('cartItems')) || [],
  }),
  getters: {
    cartCount: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
    
    // Purely local frontend estimation! 
    cartTotal: (state) => state.items.reduce((total, item) => {
      const itemBase = item.menuItem.price;
      const addonsPrice = item.selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
      return total + ((itemBase + addonsPrice) * item.quantity);
    }, 0)
  },
  actions: {
    syncToLocalStorage() {
      localStorage.setItem('cartItems', JSON.stringify(this.items));
    },

    addToCart(menuItem, selectedAddOns = [], quantity = 1) {
      // Create a unique hash for the item based on its ID and selected addons
      const addonIdsString = (selectedAddOns || []).map(a => a.id).sort().join('-');
      const cartItemId = `${menuItem.id}-${addonIdsString}`;
      
      const existingItem = this.items.find(i => i.cartItemId === cartItemId);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        this.items.push({
          cartItemId,
          menuItem,
          selectedAddOns: selectedAddOns || [],
          quantity
        });
      }
      this.syncToLocalStorage();
    },
    
    removeFromCart(cartItemId) {
      this.items = this.items.filter(i => i.cartItemId !== cartItemId);
      this.syncToLocalStorage();
    },
    
    updateQuantity(cartItemId, newQuantity) {
      const item = this.items.find(i => i.cartItemId === cartItemId);
      if (item) {
        if (newQuantity <= 0) {
           // this uses removeFromCart, which saves for us
          this.removeFromCart(cartItemId);
        } else {
          item.quantity = newQuantity;
          this.syncToLocalStorage();
        }
      }
    },
    
    clearCart() {
      this.items = [];
      this.syncToLocalStorage();
    },
    
    // Build the clean payload that the backend expects
    getBackendPayload() {
      return this.items.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        // Match the updated OrderItemRequestDto format (List<Long> selectedAddOnIds)
        selectedAddOnIds: item.selectedAddOns.map(a => a.id)
      }));
    }
  }
})