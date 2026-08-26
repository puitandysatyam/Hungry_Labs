<template>
  <div class="home">
    <section class="hero container">
      <div class="hero-content">
        <div class="pill-badge">🚀 Now Delivering in Your Area</div>
        <h1 class="hero-title">
          <span class="text-brand">Fresh.</span> <span class="text-green">Filling.</span> <br/>
          Full of flavor.
        </h1>
        <p class="hero-subtitle">
          Welcome to The Hungry Lab, where we engineer the perfect meals. 
          Wholesome ingredients, bold flavors, and absolutely no compromises.
        </p>
        <div class="hero-actions">
          <router-link to="/menu" class="btn btn-primary btn-lg">Order Now</router-link>
          <a href="#offers" class="btn btn-secondary btn-lg">View Offers</a>
        </div>
        
        <div class="stats-row">
          <div class="stat"><span class="stat-num">30m</span><span class="stat-label">Fast Delivery</span></div>
          <div class="stat"><span class="stat-num">10k+</span><span class="stat-label">Happy Eaters</span></div>
          <div class="stat"><span class="stat-num">4.9</span><span class="stat-label">Star Reviews</span></div>
        </div>
      </div>
      <div class="hero-image">
        <div class="hero-backdrop"></div>
        <!-- Dynamic Carousel -->
        <div class="carousel-container" v-if="carouselImages.length">
          <transition-group name="slide-fade" tag="div" class="carousel-wrapper">
            <img 
              v-for="(img, index) in carouselImages" 
              v-show="index === currentSlide"
              :key="'carousel-'+index" 
              :src="img.imageUrl" 
              class="hero-img-element carousel-img" 
              alt="Delicious Food Offer"
            />
          </transition-group>
          <!-- Carousel Indicators -->
          <div class="carousel-indicators" v-if="carouselImages.length > 1">
            <span 
              v-for="(img, index) in carouselImages" 
              :key="'ind-'+index" 
              class="indicator" 
              :class="{ active: index === currentSlide }"
              @click="currentSlide = index"
            ></span>
          </div>
        </div>
        <!-- Fallback if backend empty -->
        <img v-else src="/assets/hero.png" alt="Delicious Food" class="hero-img-element" />
      </div>
    </section>

    <section id="offers" class="offers-section">
      <div class="container">
        <h2 class="section-title text-center">Current <span class="text-brand">Experiments</span></h2>
        <p class="section-subtitle text-center text-muted">Limited time offers you don't want to miss.</p>
        
        <div class="offers-grid">
          <div class="card offer-card">
            <div class="offer-icon">🍔</div>
            <h3>First Time Scientist</h3>
            <p>Get 10% off your first order! Use code <strong class="code-badge">HUNGRY10</strong> at checkout.</p>
          </div>
          <div class="card offer-card">
            <div class="offer-icon">🥪</div>
            <h3>Sandwich Combo</h3>
            <p>Buy any sandwich and get a Small Plain Salted Fries for just <strong>₹120</strong>!</p>
          </div>
          <div class="card offer-card">
            <div class="offer-icon">🍟</div>
            <h3>Peri Peri Party</h3>
            <p>Order 2 Large Peri Peri Fries and get an extra cheese add-on free.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const carouselImages = ref([]);
const currentSlide = ref(0);
let slideInterval = null;

const fetchCarousel = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/menu/carousel');
    if (res.ok) {
      carouselImages.value = await res.json();
      startCarousel();
    }
  } catch (e) {
    console.error("Could not fetch carousel", e);
  }
};

const startCarousel = () => {
  if (carouselImages.value.length <= 1) return;
  slideInterval = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % carouselImages.value.length;
  }, 4000); // 4 seconds per slide
};

onMounted(() => {
  fetchCarousel();
});

onUnmounted(() => {
  if(slideInterval) clearInterval(slideInterval);
})
</script>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  padding: 80px 20px 40px;
  min-height: 80vh;
}

.pill-badge {
  display: inline-block;
  background-color: var(--brand-primary-light);
  color: var(--brand-primary);
  padding: 6px 16px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: 24px;
  font-family: var(--font-heading);
}

.hero-title {
  font-size: 4.5rem;
  margin-bottom: 24px;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-muted);
  margin-bottom: 40px;
  max-width: 480px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 60px;
}

.btn-lg {
  padding: 18px 36px;
  font-size: 1.1rem;
}

.stats-row {
  display: flex;
  gap: 40px;
  border-top: 1px solid var(--border-color);
  padding-top: 30px;
}
.stat { display: flex; flex-direction: column; }
.stat-num { font-size: 1.5rem; font-weight: 800; font-family: var(--font-heading); color: var(--text-main); }
.stat-label { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }

.hero-image {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-backdrop {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--brand-primary-light) 0%, rgba(255,255,255,0) 100%);
  z-index: -1;
  filter: blur(40px);
}

.carousel-container {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.carousel-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1/1; /* keep it square/consistent */
  display: flex;
  justify-content: center;
  align-items: center;
}

.carousel-img {
  position: absolute; /* allow overlays for proper transition */
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) perspective(1000px) rotateY(-8deg) rotateX(4deg);
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.carousel-img:hover {
  transform: translate(-50%, -50%) perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.02);
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: -20px;
  z-index: 10;
}

.indicator {
  width: 12px; height: 12px;
  background: rgba(0,0,0,0.2);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
}

.indicator.active {
  background: var(--brand-primary);
  transform: scale(1.2);
}

.hero-img-element {
  max-width: 100%;
  height: auto;
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  transform: perspective(1000px) rotateY(-8deg) rotateX(4deg);
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.hero-img-element:hover {
  transform: perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.02);
}

/* Animations for Carousel */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.8s ease;
}
.slide-fade-enter-from {
  opacity: 0; transform: translate(-30%, -50%) perspective(1000px) rotateY(-15deg);
}
.slide-fade-leave-to {
  opacity: 0; transform: translate(-70%, -50%) perspective(1000px) rotateY(0deg);
}

.offers-section {
  background-color: white;
  padding: 100px 0;
  border-top: 1px solid var(--border-color);
}

.section-title {
  font-size: 3rem;
  margin-bottom: 8px;
}
.section-subtitle {
  font-size: 1.1rem;
  margin-bottom: 60px;
}

.offers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
}

.offer-card {
  text-align: center;
  padding: 48px 32px;
  background-color: var(--bg-primary);
  border: none;
  box-shadow: none;
}
.offer-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-8px);
}

.offer-icon {
  font-size: 3rem;
  margin-bottom: 24px;
  display: inline-block;
  background: white;
  width: 80px; height: 80px;
  border-radius: 50%;
  line-height: 80px;
  box-shadow: var(--shadow-sm);
}

.offer-card h3 {
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: var(--text-main);
}

.code-badge {
  background: var(--text-main);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 40px 20px;
  }
  .hero-title { font-size: 3.5rem; }
  .hero-subtitle { margin: 0 auto 40px auto; }
  .hero-actions { justify-content: center; flex-direction: column;}
  .stats-row { justify-content: center; }
  .hero-img-element { transform: none; }
  .carousel-img { transform: translate(-50%, -50%) !important; }
}
</style>