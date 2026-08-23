<template>
  <div class="home">
    <section class="hero container">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="text-brand">Fresh.</span> <span class="text-green">Filling.</span> <br/>
          Full of flavor.
        </h1>
        <p class="hero-subtitle">
          Welcome to The Hungry Lab, where we engineer the perfect meals. 
          Wholesome ingredients, bold flavors, and no compromises.
        </p>
        <div class="hero-actions">
          <router-link to="/menu" class="btn btn-primary btn-lg">Order Now</router-link>
          <a href="#offers" class="btn btn-secondary btn-lg">View Offers</a>
        </div>
      </div>
      <div class="hero-image">
        <!-- We use the burger menu as a hero image for visual appeal -->
        <img src="/assets/Menu 1.png" alt="Delicious Burgers" class="hero-img-element" />
      </div>
    </section>

    <section id="offers" class="offers-section">
      <div class="container">
        <h2 class="section-title text-center">Current <span class="text-brand">Experiments</span> (Offers)</h2>
        <div class="offers-grid">
          <div class="card offer-card">
            <h3>🧪 First Time Scientist</h3>
            <p>Get 10% off your first order! Use code <strong class="text-brand">HUNGRY10</strong> at checkout.</p>
          </div>
          <div class="card offer-card">
            <h3>🥪 Sandwich Combo</h3>
            <p>Buy any sandwich and get a Small Plain Salted Fries for just ₹20!</p>
          </div>
          <div class="card offer-card">
            <h3>🔥 Peri Peri Party</h3>
            <p>Order 2 Large Peri Peri Fries and get extra cheese add-on free.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
  padding: 60px 20px;
  min-height: 60vh;
}

.hero-title {
  font-size: 4rem;
  margin-bottom: 24px;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-muted);
  margin-bottom: 40px;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: 16px;
}

.btn-lg {
  padding: 16px 32px;
  font-size: 1.1rem;
}

.hero-image {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-img-element {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  /* The menu has text, but as a placeholder hero image it's okay, or we could crop it */
  transform: perspective(1000px) rotateY(-5deg);
  transition: var(--transition);
}

.hero-img-element:hover {
  transform: perspective(1000px) rotateY(0deg) scale(1.02);
}

.offers-section {
  background-color: var(--bg-secondary);
  padding: 80px 0;
  margin-top: 60px;
}

.section-title {
  font-size: 2.5rem;
  margin-bottom: 40px;
}

.text-center {
  text-align: center;
}

.offers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.offer-card {
  text-align: center;
  padding: 40px 24px;
  background-color: var(--bg-primary);
}

.offer-card h3 {
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: var(--brand-secondary);
}

@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .hero-subtitle {
    margin: 0 auto 40px auto;
  }
  
  .hero-actions {
    justify-content: center;
  }
}
</style>
