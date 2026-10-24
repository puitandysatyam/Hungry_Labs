import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('../scratch_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('Building frontend before preview...');
  // Vite preview requires dist
  console.log('Starting Vite preview server on port 4174...');
  const server = spawn('cmd.exe', ['/c', 'npx.cmd', 'vite', 'preview', '--port', '4174'], {
    cwd: path.resolve('.'),
    stdio: 'pipe'
  });

  server.stdout.on('data', (d) => console.log('[Vite Preview]', d.toString().trim()));
  server.stderr.on('data', (d) => console.error('[Vite Error]', d.toString().trim()));

  // Wait 3 seconds for server to start
  await new Promise((r) => setTimeout(r, 3000));

  console.log('Launching Playwright Chromium...');
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 850 }
    });

    // Provide mock admin credentials in localStorage
    await context.addInitScript(() => {
      localStorage.setItem('token', 'mock-admin-token-12345');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        name: 'Head Chef Admin',
        email: 'chef@hungrylab.com',
        role: 'ADMIN'
      }));
    });

    const page = await context.newPage();

    // Mock API requests for menu and addons so admin tables render with mock data
    await page.route('**/api/admin/orders/active', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/admin/orders', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/admin/carousel', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

    await page.route('**/api/menu', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          name: "Crispy Paneer Royale Burger",
          category: "Burgers",
          desc: "Cottage cheese patty with tandoori mayo and jalapeños.",
          price: 189,
          veg: true,
          calories: 480,
          protein: 17,
          imageUrl: "/Menu 1.png",
          addons: [
            { id: 101, name: "Extra Melted Cheddar", price: 30, calories: 95, protein: 5.5 }
          ]
        },
        {
          id: 2,
          name: "Smoky BBQ Chicken Smash Burger",
          category: "Burgers",
          desc: "Double grilled chicken patties smothered in hickory BBQ glaze.",
          price: 249,
          veg: false,
          calories: 620,
          protein: 34,
          imageUrl: "/Menu 2.png",
          addons: [
            { id: 101, name: "Extra Melted Cheddar", price: 30, calories: 95, protein: 5.5 },
            { id: 104, name: "Crispy Bacon Strip", price: 50, calories: 120, protein: 6 }
          ]
        }
      ])
    }));

    await page.route('**/api/admin/addons', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 101, name: "Extra Melted Cheddar", price: 30, calories: 95, protein: 5.5 },
        { id: 102, name: "Spicy Chipotle Dip", price: 25, calories: 75, protein: 1.0 },
        { id: 103, name: "Jalapeño Crunch", price: 20, calories: 15, protein: 0.5 },
        { id: 104, name: "Crispy Bacon Strip", price: 50, calories: 120, protein: 6.0 }
      ])
    }));

    // 1. Visit /admin
    console.log('Navigating to http://localhost:4174/admin ...');
    await page.goto('http://localhost:4174/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 2. Click Menu Items Tab
    console.log('Switching to Menu Items tab...');
    await page.click('button.tab-btn:has-text("Menu Items")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-01-menu-table.png') });
    console.log('Saved admin-01-menu-table.png (Shows Calories & Protein in Menu Management table)');

    // 3. Open Menu Item Modal (Add New Item)
    console.log('Opening Add Menu Item Modal...');
    await page.click('button:has-text("+ Add New Item")');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-02-menu-modal.png') });
    console.log('Saved admin-02-menu-modal.png (Shows Calories & Protein inputs in Menu Modal)');

    // Close Menu Modal
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(300);

    // 4. Click Addons Tab
    console.log('Switching to Addons tab...');
    await page.click('button.tab-btn:has-text("Addons")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-03-addons-table.png') });
    console.log('Saved admin-03-addons-table.png (Shows Calories & Protein in Addon Management table)');

    // 5. Open Addon Modal (Add New Addon)
    console.log('Opening Add Addon Modal...');
    await page.click('button:has-text("+ Add New Addon")');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-04-addon-modal.png') });
    console.log('Saved admin-04-addon-modal.png (Shows Calories & Protein inputs in Addon Modal)');

    // Close Addon Modal
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(300);

    // 6. Inspect MenuView customize addons
    console.log('Navigating to http://localhost:4174/menu to inspect Addon nutrition tags...');
    await page.goto('http://localhost:4174/menu', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const customBtn = await page.$('.customize-toggle-btn');
    if (customBtn) {
      await customBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-05-menu-addon-nutrition.png') });
      console.log('Saved admin-05-menu-addon-nutrition.png (Shows Addon calorie and protein contribution)');
    }

    // 7. Mobile View of Admin Panel
    console.log('Testing Mobile Viewport for Admin Panel...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true
    });
    await mobileContext.addInitScript(() => {
      localStorage.setItem('token', 'mock-admin-token-12345');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        name: 'Head Chef Admin',
        email: 'chef@hungrylab.com',
        role: 'ADMIN'
      }));
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.route('**/api/menu', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: "Crispy Paneer Royale Burger", category: "Burgers", price: 189, veg: true, calories: 480, protein: 17, imageUrl: "/Menu 1.png" }
      ])
    }));
    await mobilePage.route('**/api/admin/addons', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 101, name: "Extra Melted Cheddar", price: 30, calories: 95, protein: 5.5 }
      ])
    }));
    await mobilePage.route('**/api/admin/orders/active', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await mobilePage.route('**/api/admin/orders', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await mobilePage.route('**/api/admin/carousel', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

    await mobilePage.goto('http://localhost:4174/admin', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);
    await mobilePage.click('button.tab-btn:has-text("Menu Items")');
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-06-mobile-menu.png') });
    console.log('Saved admin-06-mobile-menu.png (Mobile responsive admin menu table)');

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await browser.close();
    server.kill();
    console.log('Test completed.');
  }
}

run();

