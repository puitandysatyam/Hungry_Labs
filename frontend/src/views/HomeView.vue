<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero container">
      <div class="hero-content">
        <div class="pill-badge">
          <span class="pulse-dot"></span>
          🔥 Now Sizzling & Delivering Hot in Your Area
        </div>
        <h1 class="hero-title">
          <span class="text-brand">Fresh.</span> <span class="text-yellow">Sizzling.</span> <br/>
          Full of Flavor.
        </h1>
        <p class="hero-subtitle">
          Welcome to <strong>The Hungry Lab</strong> — your ultimate neighborhood fast food joint! 
          Gourmet smash burgers, loaded toasted sandwiches, and piping hot golden fries cooked to perfection with zero compromises.
        </p>
        <div class="hero-actions">
          <router-link to="/menu" class="btn btn-primary btn-lg">
            <span>Explore Menu</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </router-link>
          <a href="#offers" class="btn btn-secondary btn-lg">
            <span>🔥 Today's Offers</span>
          </a>
        </div>
        
        <div class="stats-row">
          <div class="stat">
            <span class="stat-num">30m</span>
            <span class="stat-label">Express Delivery</span>
          </div>
          <div class="stat">
            <span class="stat-num">10k+</span>
            <span class="stat-label">Happy Cravings</span>
          </div>
          <div class="stat">
            <span class="stat-num">4.9 ★</span>
            <span class="stat-label">Customer Rating</span>
          </div>
        </div>
      </div>

      <div class="hero-image">
        <div class="hero-backdrop"></div>
        <!-- Dynamic Carousel -->
        <div class="carousel-container" v-if="carouselImages.length">
          <transition-group name="slide-fade" tag="div" class="carousel-wrapper">
            <img 
              v-if="carouselImages.length > 0 && carouselImages[currentSlide]"
              :key="'carousel-' + currentSlide"
              :src="carouselImages[currentSlide].imageUrl" 
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
        <!-- Fallback when no carousel slides are uploaded yet -->
        <div class="carousel-container" v-else>
          <div class="carousel-wrapper">
            <img 
              src="/assets/Logo.png" 
              class="hero-img-element logo-hero" 
              alt="The Hungry Lab"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Sizzling Offers & Deals Section (Clickable) -->
    <section id="offers" class="offers-section">
      <div class="container">
        <div class="offers-header text-center">
          <div class="section-badge">⚡ LIMITED TIME FEASTS</div>
          <h2 class="section-title">Today's Hot <span class="text-brand">Deals & Offers</span></h2>
          <p class="section-subtitle text-muted">Tap any card to claim the deal instantly on your order!</p>
        </div>
        
        <div class="offers-grid">
          <!-- Offer 1: HUNGRY10 (Clickable Coupon) -->
          <div class="card offer-card deal-coupon" @click="claimOffer('coupon', 'HUNGRY10')">
            <div class="deal-tag">POPULAR DEAL</div>
            <div class="offer-icon">🍔</div>
            <h3>First-Timer 10% Off</h3>
            <p>Get <strong>10% OFF</strong> your order! Use code <strong class="code-badge">HUNGRY10</strong> at checkout.</p>
            <div class="deal-cta">
              <span>Apply Coupon <strong>HUNGRY10</strong></span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          </div>

          <!-- Offer 2: Sandwich Combo (Clickable Category) -->
          <div class="card offer-card deal-combo" @click="claimOffer('category', 'Sandwiches', 'Sandwich Combo')">
            <div class="deal-tag combo-tag">SUPER COMBO</div>
            <div class="offer-icon">🥪</div>
            <h3>Sandwich Feast Combo</h3>
            <p>Buy any toasted signature sandwich and add small salted fries for just <strong>₹120</strong>!</p>
            <div class="deal-cta">
              <span>Order Sandwiches Combo</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          </div>

          <!-- Offer 3: Peri Peri Fries Party (Clickable Category) -->
          <div class="card offer-card deal-fries" @click="claimOffer('category', 'Fries', 'Peri Peri Party')">
            <div class="deal-tag fries-tag">PARTY DEAL</div>
            <div class="offer-icon">🍟</div>
            <h3>Peri Peri Fries Party</h3>
            <p>Order 2 Large Peri Peri Fries and get a free melted cheese dip add-on automatically!</p>
            <div class="deal-cta">
              <span>Grab Loaded Fries</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';

const router = useRouter();
const cartStore = useCartStore();

const carouselImages = ref([]);
const currentSlide = ref(0);
let slideInterval = null;

const fetchCarousel = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/menu/carousel`);
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
  }, 4000);
};

// STRICT REQUIREMENT 10: OFFERS IN THE HOME PAGE ARE CLICKABLE WITH THAT OFFER APPLIED
const claimOffer = (type, value) => {
  if (type === 'coupon') {
    // Save to session storage so checkout picks it up automatically
    sessionStorage.setItem('pendingCoupon', value);
    if (cartStore.items.length > 0) {
      router.push({ path: '/checkout', query: { coupon: value } });
    } else {
      router.push({ path: '/menu', query: { coupon: value } });
    }
  } else if (type === 'category') {
    router.push({ path: '/menu', query: { category: value } });
  }
};

onMounted(() => {
  fetchCarousel();
});

onUnmounted(() => {
  if(slideInterval) clearInterval(slideInterval);
});
</script>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  align-items: center;
  padding: 60px 20px 40px;
  min-height: 75dvh;
}

.pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--brand-primary-light);
  color: var(--brand-primary);
  border: 1.5px solid rgba(255, 59, 0, 0.2);
  padding: 8px 18px;
  border-radius: 30px;
  font-weight: 800;
  font-size: 0.88rem;
  margin-bottom: 20px;
  font-family: var(--font-heading);
  letter-spacing: 0.02em;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: var(--brand-primary);
  border-radius: 50%;
  box-shadow: 0 0 0 rgba(255, 59, 0, 0.5);
  animation: pulse 1.8s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 59, 0, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(255, 59, 0, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 59, 0, 0); }
}

.hero-title {
  font-size: clamp(2.4rem, 6vw, 4.4rem);
  margin-bottom: 20px;
  line-height: 1.1;
  letter-spacing: -0.04em;
  font-weight: 900;
}

.hero-subtitle {
  font-size: clamp(1rem, 1.8vw, 1.18rem);
  color: var(--text-muted);
  margin-bottom: 32px;
  max-width: 520px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 48px;
  flex-wrap: wrap;
}

.btn-lg {
  padding: 15px 32px;
  font-size: 1.05rem;
}

.stats-row {
  display: flex;
  gap: 36px;
  border-top: 2px dashed var(--border-color);
  padding-top: 24px;
}
.stat { display: flex; flex-direction: column; }
.stat-num { 
  font-size: 1.6rem; 
  font-weight: 900; 
  font-family: var(--font-heading); 
  color: var(--text-main); 
  letter-spacing: -0.02em;
}
.stat-label { 
  font-size: 0.82rem; 
  color: var(--text-muted); 
  font-weight: 600; 
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hero-image {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-backdrop {
  position: absolute;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 183, 3, 0.35) 0%, rgba(255, 59, 0, 0.2) 60%, rgba(255,255,255,0) 100%);
  z-index: 0;
  filter: blur(40px);
}

.carousel-container {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}

.carousel-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 360px;
}

.carousel-img {
  position: relative;
  max-width: 100%;
  max-height: 480px;
  object-fit: contain;
  filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.15));
  transition: transform 0.4s ease;
}

.carousel-img:hover {
  transform: scale(1.03);
}

.logo-hero {
  max-height: 340px;
  object-fit: contain;
  filter: drop-shadow(0 20px 30px rgba(255, 59, 0, 0.25));
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
  z-index: 10;
}

.indicator {
  width: 12px; height: 12px;
  background: rgba(0,0,0,0.18);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
}

.indicator.active {
  background: var(--brand-primary);
  transform: scale(1.3);
}

.hero-img-element {
  border-radius: 20px;
}

/* Animations for Carousel */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-leave-active {
  position: absolute;
}
.slide-fade-enter-from {
  opacity: 0; transform: scale(0.95);
}
.slide-fade-leave-to {
  opacity: 0; transform: scale(1.05);
}

/* Offers Section */
.offers-section {
  background: linear-gradient(180deg, #ffffff 0%, var(--bg-primary) 100%);
  padding: 80px 0;
  border-top: 2px solid var(--border-color);
}

.offers-header {
  margin-bottom: 48px;
}

.section-badge {
  display: inline-block;
  background: var(--brand-yellow-light);
  color: #b45309;
  border: 1px solid #fde68a;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 5px 14px;
  border-radius: 20px;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  margin-bottom: 10px;
}
.section-subtitle {
  font-size: 1.05rem;
}

.offers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 28px;
}

/* Interactive Fast Food Deal Cards */
.offer-card {
  position: relative;
  text-align: center;
  padding: 36px 24px 28px;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.offer-card:hover {
  transform: translateY(-8px);
  border-color: var(--brand-primary);
  box-shadow: 0 16px 32px rgba(255, 59, 0, 0.18);
}

.deal-tag {
  position: absolute;
  top: 14px;
  right: -30px;
  background: var(--brand-primary);
  color: white;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  padding: 4px 32px;
  transform: rotate(45deg);
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.combo-tag { background: #d97706; }
.fries-tag { background: #16a34a; }

.offer-icon {
  font-size: 2.8rem;
  margin-bottom: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-primary-light);
  width: 72px; height: 72px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(255, 59, 0, 0.1);
  transition: transform 0.2s;
}

.offer-card:hover .offer-icon {
  transform: scale(1.1) rotate(5deg);
}

.offer-card h3 {
  font-size: 1.35rem;
  margin-bottom: 10px;
  color: var(--text-main);
}

.offer-card p {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-bottom: 24px;
  flex-grow: 1;
}

.code-badge {
  background: var(--brand-yellow-light);
  color: #92400e;
  border: 1.5px dashed #f59e0b;
  padding: 3px 8px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.95rem;
  font-weight: 800;
}

.deal-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--text-main);
  color: white;
  font-size: 0.88rem;
  font-weight: 800;
  padding: 9px 18px;
  border-radius: 25px;
  transition: var(--transition);
}

.offer-card:hover .deal-cta {
  background: var(--brand-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 59, 0, 0.35);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 30px 16px;
    gap: 36px;
  }
  .hero-subtitle { 
    margin: 0 auto 28px; 
  }
  .hero-actions { 
    justify-content: center; 
    flex-direction: column;
    gap: 12px;
  }
  .hero-actions .btn {
    width: 100%;
  }
  .stats-row { 
    justify-content: center; 
    gap: 20px;
  }
  .stat-num {
    font-size: 1.35rem;
  }
  .stat-label {
    font-size: 0.75rem;
  }
  .carousel-wrapper {
    min-height: 280px;
  }
  .carousel-img { 
    max-height: 320px; 
  }
  .offers-section {
    padding: 50px 0;
  }
  .offers-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>
