/**
 * 张家每日读书打卡 — Node.js 单文件服务
 * 同时托管前端页面 + REST API
 * 数据存储：data.json
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const HTML_FILE = path.join(__dirname, 'reading-checkin.html');

// ===== 数据管理 =====
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return { records: [] };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ===== 工具 =====
function jsonResponse(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function getQueryParams(url) {
  const idx = url.indexOf('?');
  if (idx === -1) return {};
  const params = {};
  new URLSearchParams(url.slice(idx)).forEach((v, k) => { params[k] = v; });
  return params;
}

// ===== 路由处理 =====
async function handleAPI(req, res, url) {
  const method = req.method;
  const parsed = new URL(url, 'http://localhost');
  const pathname = parsed.pathname;

  // GET /api/records
  if (method === 'GET' && pathname === '/api/records') {
    const data = loadData();
    return jsonResponse(res, 200, { records: data.records });
  }

  // POST /api/records
  if (method === 'POST' && pathname === '/api/records') {
    try {
      const body = await parseBody(req);
      const data = loadData();

      const newId = data.records.length > 0
        ? Math.max(...data.records.map(r => r.id)) + 1
        : 1;

      const record = {
        id: newId,
        userName: (body.userName || '未知').trim(),
        date: body.date || new Date().toISOString().split('T')[0],
        bookName: (body.bookName || '未命名书籍').trim(),
        content: (body.content || '').trim(),
        image: body.image || null,
        createdAt: new Date().toISOString(),
      };

      data.records.unshift(record);
      saveData(data);
      return jsonResponse(res, 200, { success: true, record });
    } catch (e) {
      return jsonResponse(res, 400, { detail: e.message });
    }
  }

  // DELETE /api/records/:id
  if (method === 'DELETE' && pathname.startsWith('/api/records/')) {
    const id = parseInt(pathname.split('/').pop(), 10);
    if (isNaN(id)) return jsonResponse(res, 400, { detail: '无效的记录ID' });

    const params = getQueryParams(url);
    const userName = params.userName || '';

    const data = loadData();
    const target = data.records.find(r => r.id === id);

    if (!target) return jsonResponse(res, 404, { detail: '记录不存在' });
    if (userName && target.userName !== userName) {
      return jsonResponse(res, 403, { detail: '只能删除自己的打卡记录哦～' });
    }

    data.records = data.records.filter(r => r.id !== id);
    saveData(data);
    return jsonResponse(res, 200, { success: true });
  }

  // GET /api/stats
  if (method === 'GET' && pathname === '/api/stats') {
    const data = loadData();
    const records = data.records;
    const today = new Date().toISOString().split('T')[0];

    const todayUsers = [...new Set(records.filter(r => r.date === today).map(r => r.userName))];

    const userCounts = {};
    records.forEach(r => {
      userCounts[r.userName] = (userCounts[r.userName] || 0) + 1;
    });
    const ranking = Object.entries(userCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const allDates = new Set(records.map(r => r.date));
    const monthPrefix = today.slice(0, 7);
    const monthDates = new Set(records.filter(r => r.date.startsWith(monthPrefix)).map(r => r.date));

    return jsonResponse(res, 200, {
      totalRecords: records.length,
      totalDays: allDates.size,
      monthDays: monthDates.size,
      todayUsers,
      ranking,
    });
  }

  return jsonResponse(res, 404, { detail: 'API not found' });
}

// ===== 静态文件 =====
function serveHTML(res) {
  try {
    const html = fs.readFileSync(HTML_FILE, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (e) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}

// ===== Server =====
const server = http.createServer(async (req, res) => {
  const url = req.url;

  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // API 路由
  if (url.startsWith('/api/')) {
    return handleAPI(req, res, url);
  }

  // 其他全部返回 HTML
  serveHTML(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`📚 张家每日读书打卡 服务已启动: http://0.0.0.0:${PORT}`);
});
