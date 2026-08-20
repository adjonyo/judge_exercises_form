import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function test() {
  console.log('Starting browser test...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=swiftshader',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    console.log(`  BROWSER: ${text}`);
  });
  page.on('pageerror', err => {
    console.log(`  PAGE ERROR: ${err.message}`);
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Create a test video in the browser using MediaRecorder + canvas
  console.log('Creating synthetic WebM test video...');
  const videoCreated = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      
      const stream = canvas.captureStream(10);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], 'test-squat.webm', { type: 'video/webm' });
        
        // Create a DataTransfer to simulate file upload
        const dt = new DataTransfer();
        dt.items.add(file);
        const input = document.querySelector('input[type="file"]');
        if (input) {
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          resolve(true);
        } else {
          resolve(false);
        }
      };
      
      recorder.start();
      
      // Draw 30 frames (3 seconds at 10fps)
      let frame = 0;
      const drawFrame = () => {
        const t = frame / 10;
        // Draw a simple figure (stickman-like)
        ctx.fillStyle = '#11111b';
        ctx.fillRect(0, 0, 320, 240);
        
        ctx.strokeStyle = '#cdd6f4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Head
        ctx.arc(160, 60 + Math.sin(t * 2) * 10, 15, 0, Math.PI * 2);
        ctx.stroke();
        // Body
        ctx.beginPath();
        ctx.moveTo(160, 75);
        ctx.lineTo(160, 150);
        ctx.stroke();
        // Arms
        ctx.beginPath();
        ctx.moveTo(130, 100 + Math.sin(t * 3) * 15);
        ctx.lineTo(160, 90);
        ctx.lineTo(190, 100 - Math.sin(t * 3) * 15);
        ctx.stroke();
        // Legs (squat motion)
        const squatOffset = Math.abs(Math.sin(t * 2)) * 30;
        ctx.beginPath();
        ctx.moveTo(160, 150);
        ctx.lineTo(130, 200 + squatOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(160, 150);
        ctx.lineTo(190, 200 + squatOffset);
        ctx.stroke();
        
        frame++;
        if (frame < 30) {
          setTimeout(drawFrame, 100);
        } else {
          recorder.stop();
        }
      };
      
      drawFrame();
    });
  });
  
  console.log('Video created:', videoCreated);
  if (!videoCreated) {
    console.log('ERROR: Could not create test video');
    await browser.close();
    return;
  }

  // Wait for VideoPlayer to appear
  await page.waitForSelector('video', { timeout: 10000 });
  console.log('VideoPlayer appeared');

  // Wait for video to load
  console.log('Waiting for video to load...');
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const info = await page.evaluate(() => {
      const v = document.querySelector('video');
      return v ? { readyState: v.readyState, duration: v.duration, w: v.videoWidth, h: v.videoHeight, err: v.error?.message } : null;
    });
    console.log(`  Video state:`, JSON.stringify(info));
    if (info && info.readyState >= 1) break;
  }

  // Find and click the Analyze Video button (not exercise buttons)
  console.log('Looking for Analyze Video button...');
  const clicked = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const b of buttons) {
      if (b.textContent?.includes('Analyze Video')) {
        b.click();
        return true;
      }
    }
    return false;
  });
  console.log('Analyze button clicked:', clicked);

  if (!clicked) {
    console.log('ERROR: Analyze Video button not found');
    const pageText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('Page text:', pageText);
    await browser.close();
    return;
  }

  // Monitor progress for 120 seconds (model download can be slow)
  console.log('Monitoring analysis for up to 120 seconds...');
  let lastProgress = -1;
  let stuckCount = 0;
  
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    
    const status = await page.evaluate(() => {
      // Look for progress text
      const allText = document.body.innerText;
      const progressMatch = allText.match(/(\d+)%/);
      const errorEl = document.querySelector('[class*="text-red-400"]');
      const analyzingEl = Array.from(document.querySelectorAll('span')).find(s => s.textContent?.includes('Analyzing'));
      
      // Check if results panel appeared
      const resultsPanel = document.querySelector('[class*="ResultsPanel"]') || 
                          allText.includes('Overall Score') || 
                          allText.includes('Replay');
      
      return {
        progress: progressMatch ? parseInt(progressMatch[1]) : null,
        error: errorEl?.textContent || null,
        isAnalyzing: !!analyzingEl,
        hasResults: resultsPanel,
        pageSnippet: allText.substring(0, 200).replace(/\n/g, ' | '),
      };
    });

    const elapsed = ((i + 1) * 2);
    
    if (status.error) {
      console.log(`[${elapsed}s] ERROR: ${status.error}`);
      break;
    }
    
    if (status.hasResults) {
      console.log(`[${elapsed}s] ANALYSIS COMPLETE!`);
      console.log('Results:', status.pageSnippet);
      break;
    }
    
    if (status.progress !== null) {
      console.log(`[${elapsed}s] Progress: ${status.progress}% | Analyzing: ${status.isAnalyzing}`);
      
      if (status.progress === lastProgress && status.progress > 0) {
        stuckCount++;
        if (stuckCount >= 10) {
          console.log(`[${elapsed}s] STUCK at ${status.progress}% for ${stuckCount * 2}s`);
          break;
        }
      } else {
        stuckCount = 0;
        lastProgress = status.progress;
      }
      
      if (status.progress >= 100) {
        console.log('Analysis reached 100%');
        break;
      }
    } else {
      console.log(`[${elapsed}s] No progress found. Page: ${status.pageSnippet.substring(0, 100)}`);
    }
  }

  // Dump all console logs
  console.log('\n--- Browser console logs ---');
  for (const log of logs) {
    console.log(log);
  }

  await browser.close();
  console.log('\nTest complete.');
}

test().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
