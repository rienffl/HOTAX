
import 'dotenv/config';
import { pool } from './db.js';
import bcrypt from 'bcryptjs';
(async ()=>{
  const hash = await bcrypt.hash('Inwoo5867^', 10);
  await pool.query(
    "insert into users(student_id,name,role,password_hash) values($1,$2,$3,$4) on conflict (student_id) do update set password_hash=excluded.password_hash, name=excluded.name, role=excluded.role",
    ['rienffl','관리자','admin',hash]
  );
  console.log('Seeded admin user.');
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
