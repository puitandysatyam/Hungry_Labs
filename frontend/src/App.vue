<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="container nav-content">
        <router-link to="/" class="logo-container">
          <img src="/assets/Logo.png" alt="The Hungry Lab" class="nav-logo" />
        </router-link>
        
        <div class="nav-links">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/menu" class="nav-link">Menu</router-link>
          <router-link to="/checkout" class="nav-link cart-link">
            Cart <span class="cart-count">0</span>
          </router-link>
          <router-link to="/admin" class="nav-link text-muted" style="font-size: 0.85rem">Admin</router-link>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view></router-view>
    </main>

    <footer class="footer">
      <div class="container text-center">
        <p>&copy; 2026 The Hungry Lab. Fresh. Filling. Full of flavor.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  background-color: var(--bg-secondary);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 10px 0;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  height: 60px;
  width: auto;
  transition: var(--transition);
}

.nav-logo:hover {
  transform: scale(1.05);
}

.nav-links {
  display: flex;
  gap: 24px;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: var(--text-main);
  font-weight: 600;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  transition: var(--transition);
}

.nav-link:hover, .nav-link.router-link-active {
  color: var(--brand-primary);
}

.cart-link {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--brand-primary);
  color: white !important;
  padding: 8px 16px;
  border-radius: 20px;
}

.cart-link:hover {
  background-color: var(--brand-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.cart-count {
  background-color: white;
  color: var(--brand-primary);
  font-size: 0.85rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: bold;
}

.main-content {
  flex: 1;
  padding: 40px 0;
}

.footer {
  background-color: var(--bg-secondary);
  padding: 24px 0;
  border-top: 1px solid rgba(0,0,0,0.05);
  margin-top: auto;
  color: var(--text-muted);
}
</style>
