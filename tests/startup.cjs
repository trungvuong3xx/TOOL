const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.env.TIKTOK_TEST_ROOT || path.resolve(__dirname, '..');
const server = http.createServer((req,res) => {
 const name = new URL(req.url,'http://localhost').pathname.slice(1) || 'index.html';
 const file = path.join(root,name);
 if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
 res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':name.endsWith('.html')?'text/html':name.endsWith('.svg')?'image/svg+xml':'application/octet-stream');
 res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const rows=[];
 try {
 for(let i=0;i<3;i++) {
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const cdp=await context.newCDPSession(page);
 await cdp.send('Network.enable');
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8});
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const visit of ['fresh','cached','offline']) {
 if(visit==='offline') await context.setOffline(true);
 await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'load'});
 await page.waitForTimeout(250);
 const m=await page.evaluate(()=>({domReady:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),fcp:Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime||0)}));
 await page.locator('#affiliateLink').fill('https://www.tiktok.com/test');
 await page.locator('#commission').fill('25000');
 if(!(await page.locator('#replyOutput').inputValue()).includes('15.750')) throw Error('Calculation failed');
 assert.deepEqual(errors, []);
 rows.push({sample:i+1,visit,...m,errors:[...errors]});
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 }
 await page.locator('#customMessage').fill('Gửi khách thử nghiệm');
 await page.locator('#resetButton').click();
 assert.equal(await page.locator('#customMessage').inputValue(), 'Gửi khách thử nghiệm');
 assert.equal(await page.locator('#replyOutput').inputValue(), '');
 await page.locator('#affiliateLink').fill('https://www.tiktok.com/test');
 await page.locator('#commission').fill('25000');
 assert((await page.locator('#replyOutput').inputValue()).includes('Gửi khách thử nghiệm'));
 await page.locator('#commission').fill('invalid');
 assert.equal(await page.locator('#replyOutput').inputValue(), '');
 assert.equal(await page.locator('#copyButton').isDisabled(), true);
 await context.close();
 }
 if (!process.env.TIKTOK_TEST_ROOT) {
 const context = await browser.newContext();
 await context.addInitScript(() => {
   Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
   Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.copiedText = text; } } });
 });
 const page = await context.newPage();
 const errors = []; page.on('pageerror', error => errors.push(error.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.locator('#affiliateLink').fill('https://www.tiktok.com/test');
 await page.locator('#commission').fill('25000');
 await page.locator('#customMessage').fill('Storage blocked');
 await page.locator('#copyButton').click();
 assert((await page.evaluate(() => window.copiedText)).includes('15.750'));
 assert((await page.evaluate(() => window.copiedText)).includes('Storage blocked'));
 await page.locator('#commission').fill('50000');
 assert.equal(await page.locator('#copyButton').textContent(), 'Sao chép tin nhắn');
 assert((await page.locator('#replyOutput').inputValue()).includes('31.500'));
 assert.deepEqual(errors, []);
 await context.close();
 console.log('PASS: blocked storage, copy, edited result, reset and invalid-input regression checks.');
 }
 console.log(JSON.stringify({profile:'Local HTTP, 390x844, simulated 1.6Mbps / 150ms latency / CPU 4x',rows},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
