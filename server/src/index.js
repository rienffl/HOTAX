
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pool } from './db.js';
import { signToken, authRequired, verifyPassword } from './auth.js';

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: (process.env.CORS_ORIGIN? process.env.CORS_ORIGIN.split(','): true) }));

app.get('/health', (req,res)=>res.json({ok:true}));

// --- Auth
app.post('/auth/login', async (req,res)=>{
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({error:'Missing credentials'});
  const { rows } = await pool.query('select * from users where student_id=$1',[username]);
  const user = rows[0];
  if(!user) return res.status(401).json({error:'Invalid credentials'});
  const ok = await verifyPassword(password, user.password_hash);
  if(!ok) return res.status(401).json({error:'Invalid credentials'});
  const token = signToken(user);
  res.json({ token, user:{ name:user.name, role:user.role, student_id:user.student_id } });
});

// --- Public
app.get('/public/notices', async (req,res)=>{
  const { rows } = await pool.query("select id,kind,title,body,image_url,created_at from notices where is_public=true order by created_at desc");
  res.json(rows);
});
app.get('/public/finance/summary', async (req,res)=>{
  const { rows: i } = await pool.query("select coalesce(sum(amount),0)::int as total from finance_entries where kind='income'");
  const { rows: e } = await pool.query("select coalesce(sum(amount),0)::int as total from finance_entries where kind='expense'");
  res.json({ income:i[0].total, expense:e[0].total, balance:i[0].total - e[0].total });
});

// --- Student (self)
app.get('/me/taxes', authRequired(['student','admin']), async (req,res)=>{
  const sid = req.user.role==='student' ? req.user.student_id : (req.query.student_id || req.user.student_id);
  const { status, sort='date_desc' } = req.query;
  const params=[sid]; let where=" where student_id=$1 "; 
  if(status){ params.push(status); where += ` and status=$${params.length} `;}
  let order = sort==='date_asc' ? " order by imposed_on asc, id asc " : " order by imposed_on desc, id desc ";
  const { rows } = await pool.query(`select id,item,amount,imposed_on,status,paid_on,delinquent_on,memo from taxes ${where} ${order}`, params);
  res.json(rows);
});

// --- Admin: search all taxes
app.get('/admin/taxes/search', authRequired(['admin']), async (req,res)=>{
  const { q, status, sort='date_desc' } = req.query;
  let where = " where true "; const params=[];
  if(q){ params.push(`%${q}%`); where += ` and (student_id ilike $${params.length} or exists(select 1 from users u where u.student_id=taxes.student_id and u.name ilike $${params.length}))`; }
  if(status){ params.push(status); where += ` and status=$${params.length}`; }
  let order = sort==='date_asc' ? " order by imposed_on asc, id asc " : " order by imposed_on desc, id desc ";
  const { rows } = await pool.query(
    `select taxes.*, (select name from users u where u.student_id=taxes.student_id) as name from taxes ${where} ${order}`, params
  );
  res.json(rows);
});

// --- Admin: notices
app.post('/admin/notices', authRequired(['admin']), async (req,res)=>{
  const { kind,title,body,image_url,is_public=true } = req.body;
  const { rows } = await pool.query("insert into notices(kind,title,body,image_url,is_public) values($1,$2,$3,$4,$5) returning *",[kind,title,body,image_url,is_public]);
  res.json(rows[0]);
});
app.put('/admin/notices/:id', authRequired(['admin']), async (req,res)=>{
  const { id } = req.params;
  const { kind,title,body,image_url,is_public=true } = req.body;
  const { rows } = await pool.query("update notices set kind=$1,title=$2,body=$3,image_url=$4,is_public=$5 where id=$6 returning *",[kind,title,body,image_url,is_public,id]);
  res.json(rows[0]);
});
app.delete('/admin/notices/:id', authRequired(['admin']), async (req,res)=>{
  await pool.query("delete from notices where id=$1",[req.params.id]);
  res.json({ok:true});
});

// --- Admin: finance
app.get('/admin/finance', authRequired(['admin']), async (req,res)=>{
  const { rows } = await pool.query("select * from finance_entries order by occurred_on desc, id desc");
  res.json(rows);
});
app.post('/admin/finance', authRequired(['admin']), async (req,res)=>{
  const { kind,item,amount,occurred_on,note } = req.body;
  const { rows } = await pool.query("insert into finance_entries(kind,item,amount,occurred_on,note) values($1,$2,$3,$4,$5) returning *",[kind,item,amount,occurred_on,note]);
  res.json(rows[0]);
});
app.delete('/admin/finance/:id', authRequired(['admin']), async (req,res)=>{
  await pool.query("delete from finance_entries where id=$1",[req.params.id]);
  res.json({ok:true});
});

// --- Admin: taxes CRUD
app.post('/admin/taxes', authRequired(['admin']), async (req,res)=>{
  const { student_id,item,amount,imposed_on,status,memo,delinquent_on } = req.body;
  let paid_on = null; let delinquent = delinquent_on || null;
  if(status==='납부') paid_on = imposed_on;
  if(status==='체납' && !delinquent) delinquent = new Date().toISOString().slice(0,10);
  const { rows } = await pool.query(
    "insert into taxes(student_id,item,amount,imposed_on,status,paid_on,delinquent_on,memo) values($1,$2,$3,$4,$5,$6,$7,$8) returning *",
    [student_id,item,amount,imposed_on,status,paid_on,delinquent,memo]
  );
  res.json(rows[0]);
});
app.put('/admin/taxes/:id', authRequired(['admin']), async (req,res)=>{
  const { id } = req.params; const { status, memo } = req.body;
  let paid_on=null, delinquent_on=null;
  if(status==='납부'){ const { rows } = await pool.query("select imposed_on from taxes where id=$1",[id]); paid_on = rows[0]?.imposed_on; }
  if(status==='체납'){ delinquent_on = new Date().toISOString().slice(0,10); }
  const { rows } = await pool.query("update taxes set status=$1, memo=coalesce($2,memo), paid_on=coalesce($3,paid_on), delinquent_on=coalesce($4,delinquent_on) where id=$5 returning *",
    [status, memo, paid_on, delinquent_on, id]);
  res.json(rows[0]);
});
app.delete('/admin/taxes/:id', authRequired(['admin']), async (req,res)=>{
  await pool.query("delete from taxes where id=$1",[req.params.id]);
  res.json({ok:true});
});

// --- Admin: users
app.get('/admin/users', authRequired(['admin']), async (req,res)=>{
  const { rows } = await pool.query("select id,student_id,name,role,created_at from users order by created_at desc");
  res.json(rows);
});
app.post('/admin/users', authRequired(['admin']), async (req,res)=>{
  const { student_id,name,role,password } = req.body;
  const bcrypt = (await import('bcryptjs')).default;
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query("insert into users(student_id,name,role,password_hash) values($1,$2,$3,$4) returning id,student_id,name,role,created_at",[student_id,name,role,hash]);
  res.json(rows[0]);
});
app.put('/admin/users/:student_id', authRequired(['admin']), async (req,res)=>{
  const { student_id } = req.params; const { name, role, password } = req.body;
  const updates=[]; const params=[];
  if(name){ params.push(name); updates.push(`name=$${params.length}`); }
  if(role){ params.push(role); updates.push(`role=$${params.length}`); }
  if(password){ const bcrypt=(await import('bcryptjs')).default; const hash=await bcrypt.hash(password,10); params.push(hash); updates.push(`password_hash=$${params.length}`); }
  if(!updates.length) return res.json({ok:true});
  params.push(student_id);
  const { rows } = await pool.query(`update users set ${updates.join(', ')} where student_id=$${params.length} returning id,student_id,name,role,created_at`, params);
  res.json(rows[0]);
});
app.delete('/admin/users/:student_id', authRequired(['admin']), async (req,res)=>{
  await pool.query("delete from users where student_id=$1",[req.params.student_id]);
  res.json({ok:true});
});

const port = process.env.PORT || 8080;
app.listen(port, ()=>console.log('HOTAX server running on', port));
