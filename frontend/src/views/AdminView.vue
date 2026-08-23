<template>
  <div class="admin-view container">
    <div class="header">
      <h1 class="page-title">Admin <span class="text-green">Dashboard</span></h1>
      <p class="text-muted">Manage your store, menu, and orders.</p>
    </div>

    <div class="admin-grid">
      <div class="card">
        <h3>Orders Overview</h3>
        <p class="text-muted">You have 0 active orders.</p>
      </div>
      <div class="card">
        <h3>Menu Management</h3>
        <p class="text-muted">Manage the 5 items currently on your menu.</p>
        <button class="btn btn-secondary mt-4">Edit Menu</button>
      </div>
      <div class="card">
        <h3>Coupons & Offers</h3>
        <p class="text-muted">Manage active discount codes.</p>
        <button class="btn btn-secondary mt-4">Edit Coupons</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header { margin-bottom: 40px; }
.page-title { font-size: 2.5rem; margin-bottom: 8px; }
.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
.mt-4 { margin-top: 16px; }
</style>
