<template>
  <div class="checkout-view container">
    <div class="header text-center">
      <h1 class="page-title">Secure <span class="text-brand">Checkout</span></h1>
      <p class="text-muted">Review your items and complete your order.</p>
    </div>

    <div class="checkout-grid">
      <div class="cart-summary card">
        <h2>Order Summary</h2>
        <p class="text-muted">Your cart is currently empty. (Mocked)</p>
        <router-link to="/menu" class="btn btn-secondary mt-4">Back to Menu</router-link>
      </div>

      <div class="checkout-form card">
        <h2>Delivery Details</h2>
        <form @submit.prevent="placeOrder">
          <div class="form-group">
            <label>Name</label>
            <input type="text" class="form-control" placeholder="John Doe" required />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" class="form-control" placeholder="9876543210" required />
          </div>
          <div class="form-group">
            <label>Address</label>
            <textarea class="form-control" placeholder="Enter full address" required></textarea>
          </div>
          
          <button type="submit" class="btn btn-primary w-100 mt-4">Place Order (Pay on Delivery)</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const placeOrder = () => {
  alert("Mock Order Placed! In the future, this will redirect to Razorpay/Stripe.")
}
</script>

<style scoped>
.header { margin-bottom: 40px; }
.page-title { font-size: 2.5rem; margin-bottom: 8px; }
.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 32px;
}
.form-group { margin-bottom: 16px; }
.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
}
.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
}
.w-100 { width: 100%; }
.mt-4 { margin-top: 16px; }

@media (max-width: 768px) {
  .checkout-grid { grid-template-columns: 1fr; }
}
</style>
