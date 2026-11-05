/**
 * THAY/CO HUB 3D - lightweight, dependency-free local backend.
 * Node.js >=20. Secrets never sent to the browser.
 */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
// Tu dong sua bo cuc GitHub neu index.html duoc upload o thu muc goc.
// Chi sao chep trang HTML vao 'public'; khong bao gio phuc vu file bi mat o thu muc goc.
if (!fs.existsSync(path.join(PUBLIC, 'index.html')) && fs.existsSync(path.join(ROOT, 'index.html'))) {
  fs.mkdirSync(PUBLIC, {recursive: true});
  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(PUBLIC, 'index.html'));
}
const DB_FILE = path.join(ROOT, 'data', 'workspace.json');

function readEnv() {
  const p = path.join(ROOT, '.env');
  if (!fs.existsSync(p)) return;
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || Object.prototype.hasOwnProperty.call(process.env, match[1])) continue;
    let v = match[2].trim();
    if ((v[0] === '"' && v[v.length - 1] === '"') || (v[0] === "'" && v[v.length - 1] === "'")) v = v.slice(1, -1);
    process.env[match[1]] = v;
  }
}
readEnv();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const APP_PASSWORD = process.env.APP_PASSWORD || '';
const API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const SECURE_COOKIE = process.env.COOKIE_SECURE === '1';
const SESSION_SECRET = crypto.randomBytes(32);
const CONTENT_TYPES = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon'};
const AGENTS = {
  script: ['AI Biên kịch', 'Bạn là biên kịch nội dung giáo dục và truyền thông. Hãy viết kịch bản theo các cảnh, thời lượng, thoại/voice-over, hình ảnh, hook và CTA. Không hứa có video được dựng sẵn.'],
  write: ['AI Viết bài', 'Bạn là biên tập viên nội dung tiếng Việt chuyên nghiệp. Viết bài phù hợp nền tảng, giọng điệu, nhóm độc giả, kèm tiêu đề, cấu trúc và CTA.'],
  video: ['AI Dựng video', 'Bạn là đạo diễn hậu kỳ. Trả về storyboard, shot list, nhịp dựng, chỉ dẫn hình/âm thanh/phụ đề và hướng dẫn dựng. Bạn KHÔNG trực tiếp render video trong ứng dụng này.'],
  posts: ['AI Quản lý bài đăng', 'Bạn là quản lý lịch nội dung. Hãy lập lịch đăng cụ thể, đề xuất caption, kênh, KPI, checklist và quy trình thực thi. Không tuyên bố đã đăng lên mạng xã hội.'],
  lesson: ['AI Giáo án', 'Bạn là chuyên gia thiết kế giáo án. Xuất mục tiêu đo lường được, hoạt động theo thời gian, học liệu, phân hóa, kiểm tra đánh giá và đáp án khi cần.'],
  assistant: ['AI Trợ lý cá nhân', 'Bạn là trợ lý điều hành. Đề xuất danh sách nhiệm vụ theo ưu tiên, mốc thời gian, công việc tiếp theo và rủi ro. Không tuyên bố đã gửi thông báo hay cập nhật lịch ngoài ứng dụng.'],
  care: ['AI Chăm sóc học viên', 'Bạn là cố vấn chăm sóc học viên, viết thông điệp lịch sự, đồng cảm và rõ ràng; hướng dẫn quy trình phản hồi và xử lý tình huống. Bảo vệ dữ liệu cá nhân.'],
  class: ['AI Quản lý lớp', 'Bạn là trợ lý vận hành lớp học. Lập danh sách việc cần làm, kế hoạch điểm danh, theo dõi tiến độ, ghi chú và báo cáo; không bịa dữ liệu học viên.'],
  quiz: ['AI Quiz', 'Bạn là người thiết kế bài kiểm tra. Tạo câu hỏi theo bậc học/mục tiêu, mỗi câu trắc nghiệm có duy nhất một đáp án đúng, kèm đáp án và giải thích; tự rà soát logic.'],
  grade: ['AI Chấm bài', 'Bạn là giám khảo. Chấm theo rubric do người dùng đưa ra; nhận diện dữ liệu còn thiếu; trình bày điểm từng tiêu chí và phản hồi cụ thể. Không tự suy diễn bài làm chưa được cung cấp.'],
  topik1: ['AI TOPIK I', 'Bạn là chuyên gia luyện thi TOPIK I (cấp 1–2). Phân tích ngữ pháp, từ vựng, đọc hiểu/nghe và chiến lược học, có giải thích tiếng Việt, ví dụ tiếng Hàn chính xác.'],
  topik2: ['AI TOPIK II', 'Bạn là chuyên gia luyện thi TOPIK II (cấp 3–6), chú trọng đọc, nghe, viết 51–54, rubric, logic, ngữ pháp và từ vựng. Không khẳng định điểm thi chính thức.']
};
const VALID_IDS = new Set(Object.keys(AGENTS));

function initialDB() { return {tasks:[], history:{}}; }
function loadDB() {
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return {tasks:Array.isArray(db.tasks) ? db.tasks : [], history:db.history && typeof db.history === 'object' ? db.history : {}};
  } catch { return initialDB(); }
}
let db = loadDB();
function saveDB() {
  fs.mkdirSync(path.dirname(DB_FILE), {recursive:true});
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), {mode:0o600});
  fs.renameSync(tmp, DB_FILE);
}

function response(res, status, data, extra = {}) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra});
  res.end(JSON.stringify(data));
}
function parseCookies(req) {
  const result = {};
  for (const piece of (req.headers.cookie || '').split(';')) {
    const i = piece.indexOf('=');
    if (i > 0) result[piece.slice(0,i).trim()] = piece.slice(i+1).trim();
  }
  return result;
}
function makeToken() {
  const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const value = String(expiration);
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
  return `${value}.${signature}`;
}
function authorized(req) {
  if (!APP_PASSWORD) return true;
  const token = parseCookies(req).hub_session || '';
  const [expiration, sig] = token.split('.');
  if (!expiration || !sig || !/^\d+$/.test(expiration) || Number(expiration) < Date.now()) return false;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(expiration).digest('hex');
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
async function readJson(req, maxBytes=32000) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body,'utf8') > maxBytes) throw Object.assign(new Error('Nội dung quá dài.'),{status:413});
  }
  try { return JSON.parse(body || '{}'); } catch { throw Object.assign(new Error('JSON không hợp lệ.'),{status:400}); }
}
function clean(v, max=5000) { return typeof v === 'string' ? v.trim().slice(0,max) : ''; }
function validAgent(id) { return VALID_IDS.has(id); }
function formatRequest(agentId, fields, text) {
  const labels = Object.entries(fields || {}).filter(([k,v])=> typeof k === 'string' && typeof v === 'string' && v.trim()).slice(0,12).map(([k,v]) => `- ${clean(k,100)}: ${clean(v,2200)}`);
  return [`PHÒNG BAN: ${AGENTS[agentId][0]}`, labels.length ? `THÔNG TIN ĐẦU VÀO:\n${labels.join('\n')}` : '', `YÊU CẦU CỤ THỂ:\n${text}`].filter(Boolean).join('\n\n');
}
async function askOpenAI(agentId, fields, text, history) {
  const conversation = history.slice(-8).filter(m => m && ['user','assistant'].includes(m.role) && typeof m.text === 'string').map(m => ({role:m.role,content:m.text.slice(0,4500)}));
  const payload = {
    model:MODEL,
    store:false,
    instructions:`${AGENTS[agentId][1]}\nTrả lời bằng tiếng Việt, định dạng Markdown rõ ràng. Phân biệt kế hoạch và hành động thực sự. Từ chối tuyên bố đã thực thi hành động bên ngoài khi không có công cụ. Nếu thiếu thông tin, dùng giả định được ghi rõ.`,
    input:[...conversation,{role:'user',content:formatRequest(agentId,fields,text)}],
    max_output_tokens:2600
  };
  const upstream = await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${API_KEY}`},
    body:JSON.stringify(payload),
    signal:AbortSignal.timeout(90000)
  });
  const data = await upstream.json().catch(()=>({}));
  if (!upstream.ok) {
    const msg = typeof data.error?.message === 'string' ? data.error.message : `OpenAI API HTTP ${upstream.status}`;
    throw Object.assign(new Error(msg.slice(0,300)),{status:502});
  }
  const output = (data.output || []).flatMap(item => (item.content || [])).filter(c => c.type === 'output_text').map(c => c.text).join('\n').trim();
  if (!output) throw Object.assign(new Error('API không trả về nội dung văn bản.'), {status:502});
  return output;
}
const loginTries = new Map();
function loginRateLimited(ip) {
  const now = Date.now();
  const entry = loginTries.get(ip) || {start:now,tries:0};
  if (now-entry.start > 60000) { entry.start=now; entry.tries=0; }
  entry.tries++;
  loginTries.set(ip,entry);
  return entry.tries > 8;
}
async function api(req,res,url) {
  const pathname=url.pathname;
  if (pathname === '/api/status' && req.method === 'GET') {
    return response(res,200,{live:Boolean(API_KEY),loginRequired:Boolean(APP_PASSWORD),authenticated:authorized(req),model:API_KEY ? MODEL : null});
  }
  if (pathname === '/api/login' && req.method === 'POST') {
    if (!APP_PASSWORD) return response(res,200,{ok:true});
    if (loginRateLimited(req.socket.remoteAddress || 'local')) return response(res,429,{error:'Quá nhiều lượt thử. Vui lòng thử lại sau.'});
    const body=await readJson(req,4096);
    const candidate=String(body.password || '');
    const given=crypto.createHash('sha256').update(candidate).digest();
    const expected=crypto.createHash('sha256').update(APP_PASSWORD).digest();
    if (!crypto.timingSafeEqual(given,expected)) return response(res,401,{error:'Mật khẩu không đúng.'});
    return response(res,200,{ok:true},{'Set-Cookie':`hub_session=${makeToken()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${SECURE_COOKIE?'; Secure':''}`});
  }
  if (!authorized(req)) return response(res,401,{error:'Bạn cần đăng nhập.'});
  if (pathname === '/api/logout' && req.method === 'POST') {
    return response(res,200,{ok:true},{'Set-Cookie':'hub_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'});
  }
  if (pathname === '/api/tasks' && req.method === 'GET') return response(res,200,{tasks:db.tasks});
  if (pathname === '/api/tasks' && req.method === 'POST') {
    const body=await readJson(req);
    if (!validAgent(body.agentId)) return response(res,400,{error:'Phòng AI không hợp lệ.'});
    const title=clean(body.title,140);
    if (!title) return response(res,400,{error:'Vui lòng nhập tên công việc.'});
    const due=clean(body.dueDate,10);
    if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) return response(res,400,{error:'Ngày hẹn không hợp lệ.'});
    const task={id:crypto.randomUUID(),agentId:body.agentId,title,notes:clean(body.notes,12000),status:'todo',dueDate:due,createdAt:new Date().toISOString()};
    db.tasks.unshift(task); db.tasks=db.tasks.slice(0,800); saveDB();
    return response(res,201,{task});
  }
  const taskMatch=pathname.match(/^\/api\/tasks\/([a-f0-9-]{36})$/);
  if (taskMatch && req.method==='PATCH') {
    const task=db.tasks.find(t=>t.id===taskMatch[1]);
    if (!task) return response(res,404,{error:'Không tìm thấy công việc.'});
    const body=await readJson(req,4096);
    if (!['todo','doing','done'].includes(body.status)) return response(res,400,{error:'Trạng thái không hợp lệ.'});
    task.status=body.status; saveDB(); return response(res,200,{task});
  }
  if (taskMatch && req.method==='DELETE') {
    db.tasks=db.tasks.filter(t=>t.id!==taskMatch[1]); saveDB(); return response(res,200,{ok:true});
  }
  const historyMatch=pathname.match(/^\/api\/history\/([a-z0-9]+)$/);
  if (historyMatch && validAgent(historyMatch[1])) {
    const id=historyMatch[1];
    if (req.method==='GET') return response(res,200,{messages:db.history[id] || []});
    if (req.method==='DELETE') {db.history[id]=[];saveDB();return response(res,200,{ok:true});}
  }
  if (pathname==='/api/chat' && req.method==='POST') {
    if (!API_KEY) return response(res,409,{error:'Chưa cấu hình OPENAI_API_KEY trên máy chủ.',code:'DEMO_MODE'});
    const body=await readJson(req);
    if (!validAgent(body.agentId)) return response(res,400,{error:'Phòng AI không hợp lệ.'});
    const message=clean(body.message,6000);
    if (!message) return response(res,400,{error:'Vui lòng nhập yêu cầu.'});
    const fields={};
    if (body.fields && typeof body.fields==='object' && !Array.isArray(body.fields)) for (const [k,v] of Object.entries(body.fields).slice(0,12)) fields[clean(k,100)]=clean(v,2200);
    const id=body.agentId;
    const existing=db.history[id] || [];
    const answer=await askOpenAI(id, fields,message, existing);
    const createdAt=new Date().toISOString();
    existing.push({role:'user',text:formatRequest(id,fields,message),createdAt},{role:'assistant',text:answer,createdAt});
    db.history[id]=existing.slice(-80);
    saveDB();
    return response(res,200,{answer,messages:db.history[id]});
  }
  return response(res,404,{error:'Đường dẫn API không tồn tại.'});
}
function serveStatic(req,res,url) {
  if (req.method !== 'GET') return response(res,405,{error:'Method not allowed'});
  let pathname;
  try { pathname=decodeURIComponent(url.pathname); } catch {return response(res,400,{error:'URL không hợp lệ'});}
  if (pathname === '/') pathname='/index.html';
  const safePath=path.resolve(PUBLIC,'.'+pathname);
  if (!safePath.startsWith(PUBLIC+path.sep)) return response(res,403,{error:'Forbidden'});
  fs.readFile(safePath,(err,data)=>{
    if (err) return response(res,404,{error:'Không tìm thấy tài nguyên.'});
    const ext=path.extname(safePath);
    // HTML cua THAY/CO HUB V6 su dung 1 khoi JavaScript inline de dieu khien
    // 12 nhan vien, chuyen dong Chibi va giao viec. CSP cu (script-src 'self')
    // da chan hoan toan khoi script nay, dan den trang trong va thieu nhan vien.
    // Chi cho phep cac khoi inline script CO NOI DUNG CHINH XAC trong HTML,
    // bang ma bam SHA-256; an toan hon so voi 'unsafe-inline'.
    const inlineHashes = ext === '.html'
      ? [...data.toString('utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)]
          .filter(match => !/\bsrc\s*=/.test(match[0].slice(0, match[0].indexOf('>'))))
          .map(match => "'sha256-" + crypto.createHash('sha256').update(match[1], 'utf8').digest('base64') + "'")
      : [];
    const csp = "default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' " + inlineHashes.join(' ') + "; connect-src 'self'";
    res.writeHead(200,{'Content-Type':CONTENT_TYPES[ext] || 'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache','Content-Security-Policy':csp});
    res.end(data);
  });
}
const server=http.createServer(async (req,res)=>{
  try {
    const url=new URL(req.url,'http://local');
    if (url.pathname.startsWith('/api/')) return await api(req,res,url);
    return serveStatic(req,res,url);
  } catch (err) {
    console.error('Request failed:',err.message);
    return response(res,err.status || 500,{error:err.status ? err.message : 'Lỗi máy chủ. Vui lòng kiểm tra terminal.'});
  }
});
server.listen(PORT,HOST,()=>{
  console.log(`\nTHAY/CO HUB 3D: http://${HOST}:${PORT}`);
  console.log(`OpenAI: ${API_KEY?'READY ('+MODEL+')':'DEMO - chưa co OPENAI_API_KEY'}`);
  if (!APP_PASSWORD) console.log('Bao mat: Chua dat APP_PASSWORD. Chi su dung localhost; dat mat khau neu trien khai qua mang.');
});
