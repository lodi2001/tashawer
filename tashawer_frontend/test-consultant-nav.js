const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:3001/login');
  await page.waitForLoadState('networkidle');

  // Take screenshot of login page
  await page.screenshot({ path: '/tmp/01-login-page.png' });
  console.log('   Screenshot saved: /tmp/01-login-page.png');

  console.log('2. Filling login form...');
  await page.fill('input[type="email"]', 'consultant@tashawer.com');
  await page.fill('input[type="password"]', 'Test@123');

  // Take screenshot before submitting
  await page.screenshot({ path: '/tmp/02-login-filled.png' });
  console.log('   Screenshot saved: /tmp/02-login-filled.png');

  console.log('3. Submitting login...');
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');

  // Take screenshot after login
  await page.screenshot({ path: '/tmp/03-after-login.png' });
  console.log('   Screenshot saved: /tmp/03-after-login.png');
  console.log('   Current URL:', page.url());

  console.log('4. Checking navigation sidebar...');

  // Get all nav links
  const navLinks = await page.$$eval('nav a', links =>
    links.map(link => ({
      text: link.textContent.trim(),
      href: link.getAttribute('href')
    }))
  );

  console.log('\n   Navigation links found:');
  navLinks.forEach(link => {
    console.log(`   - ${link.text}: ${link.href}`);
  });

  // Take final screenshot
  await page.screenshot({ path: '/tmp/04-navigation.png', fullPage: true });
  console.log('\n   Full page screenshot saved: /tmp/04-navigation.png');

  // Check for expected consultant links
  const expectedLinks = [
    'Dashboard',
    'Browse Projects',
    'My Proposals',
    'Invitations',
    'Messages',
    'Portfolio',
    'Skills',
    'Certifications',
    'Payments',
    'My Reviews',
    'Profile'
  ];

  console.log('\n5. Checking for expected consultant navigation items:');
  const foundLinks = navLinks.map(l => l.text);
  expectedLinks.forEach(expected => {
    const found = foundLinks.includes(expected);
    console.log(`   ${found ? '✓' : '✗'} ${expected}`);
  });

  await browser.close();
  console.log('\nTest completed!');
})();
