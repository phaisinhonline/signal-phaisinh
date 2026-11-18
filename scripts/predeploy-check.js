#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

// a. Nếu biến môi trường SKIP_DEPLOY_CHECK=1 thì in cảnh báo và thoát 0
if (process.env.SKIP_DEPLOY_CHECK === '1') {
  console.warn('[predeploy] Cảnh báo: Đã bỏ qua kiểm tra trước deploy do SKIP_DEPLOY_CHECK=1');
  process.exit(0);
}

// b. Chạy git fetch origin main --quiet. Lỗi mạng thì báo lỗi rõ ràng và thoát 1
try {
  execSync('git fetch origin main --quiet', { stdio: 'pipe' });
} catch (err) {
  const detail = ((err.stderr ? err.stderr.toString() : '') || err.message || '').trim().replace(/\r?\n/g, ' ');
  console.error(`[predeploy] Lỗi mạng hoặc không thể fetch origin/main: ${detail || 'Không thể kết nối tới remote git'}`);
  process.exit(1);
}

// c. Nếu git status --porcelain -- public src wrangler.jsonc package.json có dòng nào -> báo "Còn thay đổi chưa commit" kèm danh sách file, thoát 1
let statusOutput = '';
try {
  statusOutput = execSync('git status --porcelain -- public src wrangler.jsonc package.json', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
} catch (err) {
  const detail = ((err.stderr ? err.stderr.toString() : '') || err.message || '').trim().replace(/\r?\n/g, ' ');
  console.error(`[predeploy] Lỗi khi kiểm tra git status: ${detail}`);
  process.exit(1);
}

if (statusOutput) {
  const dirtyFiles = statusOutput
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^[^\s]+\s+/, ''))
    .join(', ');
  console.error(`[predeploy] Còn thay đổi chưa commit: ${dirtyFiles}`);
  process.exit(1);
}

// d. So git rev-parse HEAD với git rev-parse origin/main. Khác nhau -> báo "Bản trên máy khác origin/main, hãy git pull hoặc deploy từ bản sạch", in hai mã commit ngắn, thoát 1
let headHash = '';
let originMainHash = '';
try {
  headHash = execSync('git rev-parse HEAD', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  originMainHash = execSync('git rev-parse origin/main', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
} catch (err) {
  const detail = ((err.stderr ? err.stderr.toString() : '') || err.message || '').trim().replace(/\r?\n/g, ' ');
  console.error(`[predeploy] Lỗi khi lấy mã commit git: ${detail}`);
  process.exit(1);
}

if (headHash !== originMainHash) {
  const headShort = headHash.slice(0, 7);
  const originShort = originMainHash.slice(0, 7);
  console.error(`[predeploy] Bản trên máy khác origin/main, hãy git pull hoặc deploy từ bản sạch (HEAD: ${headShort}, origin/main: ${originShort})`);
  process.exit(1);
}

// e. Kiểm tra public/index.html, public/bot.html, public/404.html đều chứa chuỗi G-1X33LL2HJH. Thiếu file nào -> báo tên file, thoát 1
const GA_TRACKING_ID = 'G-1X33LL2HJH';
const requiredFiles = ['public/index.html', 'public/bot.html', 'public/404.html'];
const missingFiles = [];

for (const filePath of requiredFiles) {
  if (!existsSync(filePath)) {
    missingFiles.push(`${filePath} (không tồn tại)`);
    continue;
  }
  try {
    const content = readFileSync(filePath, 'utf8');
    if (!content.includes(GA_TRACKING_ID)) {
      missingFiles.push(filePath);
    }
  } catch (err) {
    missingFiles.push(`${filePath} (không đọc được: ${err.message})`);
  }
}

if (missingFiles.length > 0) {
  console.error(`[predeploy] Thiếu mã Google Analytics (${GA_TRACKING_ID}) trong file: ${missingFiles.join(', ')}`);
  process.exit(1);
}

// f. Tất cả đạt -> in "Kiểm tra trước deploy: đạt" và thoát 0
console.log('[predeploy] Kiểm tra trước deploy: đạt');
process.exit(0);
