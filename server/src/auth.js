
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

export function signToken(user){
  return jwt.sign({ id:user.id, role:user.role, name:user.name, student_id:user.student_id }, process.env.JWT_SECRET, { expiresIn:'7d' });
}
export function authRequired(roles=[]){
  return (req,res,next)=>{
    const auth = req.headers.authorization||'';
    const token = auth.startsWith('Bearer ')?auth.slice(7):null;
    if(!token) return res.status(401).json({error:'Unauthorized'});
    try{
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if(roles.length && !roles.includes(payload.role)) return res.status(403).json({error:'Forbidden'});
      req.user = payload; next();
    }catch(e){ return res.status(401).json({error:'Invalid token'}); }
  }
}
export async function verifyPassword(pw, hash){ return bcrypt.compare(pw, hash); }
