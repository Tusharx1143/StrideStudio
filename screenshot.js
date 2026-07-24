const { chromium } = require('C:/nvm4w/nodejs/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'D:/Personal/Projects/StrideStudio/screenshot-app.png', fullPage: true });
  console.log('Screenshot saved');
  await browser.close();
})();
