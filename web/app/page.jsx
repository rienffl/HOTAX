
'use client';
import { useEffect, useState } from 'react';
import { api, API } from './api';

export default function Page(){
  const [notices,setNotices]=useState([]);
  const [summary,setSummary]=useState({income:0,expense:0,balance:0});
  const [showLogin,setShowLogin]=useState(false);
  const [me,setMe]=useState(null);
  useEffect(()=>{
    api('/public/notices').then(setNotices);
    api('/public/finance/summary').then(setSummary);
    const s = localStorage.getItem('hotax_session'); if(s) setMe(JSON.parse(s).user);
  },[]);
  return (<div className="grid" style={{display:'grid',gap:16,gridTemplateColumns:'repeat(12,1fr)'}}>
    <div className="card" style={{gridColumn:'span 8'}}>
      <h2>배너 공지</h2>
      <div style={{display:'flex',gap:12,overflowX:'auto'}}>
        {notices.filter(n=>n.kind==='banner').map(n=>(
          <div key={n.id} className="card" style={{minWidth:260}}>
            {n.image_url && <img src={n.image_url} style={{width:'100%',borderRadius:12}}/>}
            <div style={{fontWeight:700}}>{n.title}</div>
            {n.body && <div>{n.body}</div>}
          </div>
        ))}
      </div>
    </div>
    <div className="card" style={{gridColumn:'span 4'}}>
      {!me ? (<div><h3>로그인</h3><button className="btn" onClick={()=>setShowLogin(true)}>로그인</button></div>)
        :(<div><b>{me.name}</b>님, 방문을 환영합니다.</div>)}
    </div>
    <div className="card" style={{gridColumn:'span 12'}}>
      <h2>학급 세입 현황</h2>
      <div style={{display:'flex',gap:16}}>
        <div className="card"><div>수입</div><div style={{fontSize:24,fontWeight:800}}>{summary.income.toLocaleString()}원</div></div>
        <div className="card"><div>지출</div><div style={{fontSize:24,fontWeight:800}}>{summary.expense.toLocaleString()}원</div></div>
        <div className="card"><div>잔액</div><div style={{fontSize:24,fontWeight:800}}>{summary.balance.toLocaleString()}원</div></div>
      </div>
    </div>
    <div className="card" style={{gridColumn:'span 12'}}>
      <h2>공지사항</h2>
      {notices.filter(n=>n.kind==='post').map(n=>(
        <div key={n.id} className="card" style={{marginBottom:8}}>
          <div style={{fontWeight:700}}>{n.title}</div>
          {n.body && <div>{n.body}</div>}
        </div>
      ))}
    </div>
    {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onLogged={(session)=>{ localStorage.setItem('hotax_session', JSON.stringify(session)); setMe(session.user); setShowLogin(false); }}/>}
  </div>);
}

function LoginModal({onClose,onLogged}){
  const [username,setUsername]=useState(''); const [password,setPassword]=useState(''); const [err,setErr]=useState('');
  async function tryLogin(){
    setErr('');
    try{
      const res = await fetch(`${API}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
      if(!res.ok) throw new Error('로그인 실패'); const data = await res.json(); onLogged(data);
    }catch(e){ setErr('아이디 또는 비밀번호가 올바르지 않습니다.'); }
  }
  return (<div className="modal"><div className="modal-box">
    <h3>로그인</h3>
    <input placeholder="아이디(학번)" value={username} onChange={e=>setUsername(e.target.value)} style={{width:'100%',padding:10,marginTop:8,marginBottom:8}}/>
    <input placeholder="비밀번호" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',padding:10,marginBottom:8}}/>
    {err && <div style={{color:'#c00',marginBottom:8}}>{err}</div>}
    <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
      <button className="btn outline" onClick={onClose}>닫기</button>
      <button className="btn" onClick={tryLogin}>로그인</button>
    </div>
  </div></div>);
}
