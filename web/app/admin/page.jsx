
'use client';
import { useEffect, useState } from 'react';
import { API } from '../api';
import Link from 'next/link';
export default function Page(){
  const [session,setSession]=useState(null);
  useEffect(()=>{ setSession(JSON.parse(localStorage.getItem('hotax_session')||'null')); },[]);
  if(!session || session.user.role!=='admin') return <div className="card">관리자 계정으로 로그인해야 합니다.</div>;
  return (<div className="grid" style={{display:'grid',gap:16,gridTemplateColumns:'repeat(12,1fr)'}}>
    <div className="card" style={{gridColumn:'span 12'}}>
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
        <a href="#notices" className="btn">공지 관리</a>
        <a href="#finance" className="btn">세입/지출 관리</a>
        <a href="#taxes" className="btn">납세 관리</a>
        <a href="#users" className="btn">계정 관리</a>
        <Link className="btn" href="/admin/onestop">원스톱 납세 조회 시스템</Link>
      </div>
    </div>
    <Section id="notices" title="공지 관리"><Notices session={session}/></Section>
    <Section id="finance" title="세입/지출 관리"><Finance session={session}/></Section>
    <Section id="taxes" title="납세 관리"><Taxes session={session}/></Section>
    <Section id="users" title="계정 관리"><Users session={session}/></Section>
  </div>);
}
function Section({id,title,children}){ return <div id={id} className="card" style={{gridColumn:'span 12'}}><h3>{title}</h3>{children}</div>; }

function Notices({session}){
  const [list,setList]=useState([]); const [form,setForm]=useState({kind:'banner',title:'',body:'',image_url:''});
  const fetchList=()=>fetch(`${API}/public/notices`).then(r=>r.json()).then(setList);
  useEffect(fetchList,[]);
  return (<div>
    <div style={{display:'flex',gap:8,marginBottom:8}}>
      <select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="banner">배너</option><option value="post">글</option></select>
      <input placeholder="제목" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
      <input placeholder="이미지 URL(선택)" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} style={{width:240}}/>
      <input placeholder="내용" value={form.body} onChange={e=>setForm({...form,body:e.target.value})} style={{width:280}}/>
      <button className="btn" onClick={async()=>{
        await fetch(`${API}/admin/notices`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.token}`},body:JSON.stringify({...form,is_public:true})});
        setForm({kind:'banner',title:'',body:'',image_url:''}); fetchList();
      }}>추가</button>
    </div>
    {list.map(n=>(
      <div key={n.id} className="card" style={{marginBottom:6,display:'flex',justifyContent:'space-between'}}>
        <div><b>[{n.kind}]</b> {n.title}</div>
        <button className="btn outline" onClick={async()=>{await fetch(`${API}/admin/notices/${n.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${session.token}`}}); fetchList();}}>삭제</button>
      </div>
    ))}
  </div>);
}

function Finance({session}){
  const [list,setList]=useState([]);
  const [form,setForm]=useState({kind:'income',item:'',amount:0,occurred_on:new Date().toISOString().slice(0,10),note:''});
  const fetchList=()=>fetch(`${API}/admin/finance`,{headers:{Authorization:`Bearer ${session.token}`}}).then(r=>r.json()).then(setList);
  useEffect(fetchList,[]);
  return (<div>
    <div style={{display:'flex',gap:8,marginBottom:8}}>
      <select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="income">수입</option><option value="expense">지출</option></select>
      <input placeholder="항목" value={form.item} onChange={e=>setForm({...form,item:e.target.value})}/>
      <input type="number" placeholder="금액" value={form.amount} onChange={e=>setForm({...form,amount:Number(e.target.value)})}/>
      <input type="date" value={form.occurred_on} onChange={e=>setForm({...form,occurred_on:e.target.value})}/>
      <input placeholder="비고" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
      <button className="btn" onClick={async()=>{
        await fetch(`${API}/admin/finance`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.token}`},body:JSON.stringify(form)});
        setForm({...form,item:'',amount:0,note:''}); fetchList();
      }}>추가</button>
    </div>
    <table width="100%">
      <thead><tr><th>구분</th><th>항목</th><th>금액</th><th>일자</th><th>비고</th><th/></tr></thead>
      <tbody>
        {list.map(r=>(
          <tr key={r.id}><td>{r.kind==='income'?'수입':'지출'}</td><td>{r.item}</td><td>{r.amount.toLocaleString()}원</td><td>{r.occurred_on}</td><td>{r.note||''}</td>
          <td><button className="btn outline" onClick={async()=>{await fetch(`${API}/admin/finance/${r.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${session.token}`}}); fetchList();}}>삭제</button></td></tr>
        ))}
      </tbody>
    </table>
  </div>);
}

function Taxes({session}){
  const [list,setList]=useState([]);
  const [form,setForm]=useState({student_id:'',item:'지각세',amount:0,imposed_on:new Date().toISOString().slice(0,10),status:'미납',memo:''});
  const fetchMine=()=>fetch(`${API}/admin/taxes/search`,{headers:{Authorization:`Bearer ${session.token}`}}).then(r=>r.json()).then(setList);
  useEffect(fetchMine,[]);
  return (<div>
    <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
      <input placeholder="학번" value={form.student_id} onChange={e=>setForm({...form,student_id:e.target.value})}/>
      <input placeholder="항목" value={form.item} onChange={e=>setForm({...form,item:e.target.value})}/>
      <input type="number" placeholder="세액" value={form.amount} onChange={e=>setForm({...form,amount:Number(e.target.value)})}/>
      <input type="date" value={form.imposed_on} onChange={e=>setForm({...form,imposed_on:e.target.value})}/>
      <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>미납</option><option>체납</option><option>납부</option></select>
      <input placeholder="비고" value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})}/>
      <button className="btn" onClick={async()=>{
        await fetch(`${API}/admin/taxes`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.token}`},body:JSON.stringify(form)});
        setForm({...form,student_id:'',amount:0,memo:''}); fetchMine();
      }}>추가</button>
    </div>
    <table width="100%">
      <thead><tr><th>학번</th><th>이름</th><th>항목</th><th>세액</th><th>부과일</th><th>상태</th><th>메모</th><th/></tr></thead>
      <tbody>
        {list.map(r=>(
          <tr key={r.id}><td>{r.student_id}</td><td>{r.name||''}</td><td>{r.item}</td><td>{r.amount.toLocaleString()}원</td><td>{r.imposed_on}</td>
          <td><span className={`badge ${r.status}`}>{r.status}</span></td><td>{r.memo||''}</td>
          <td style={{whiteSpace:'nowrap'}}>
            <button className="btn outline" onClick={async()=>{await fetch(`${API}/admin/taxes/${r.id}`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.token}`},body:JSON.stringify({status:'납부'})}); fetchMine();}}>납부</button>{' '}
            <button className="btn outline" onClick={async()=>{await fetch(`${API}/admin/taxes/${r.id}`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.token}`},body:JSON.stringify({status:'체납'})}); fetchMine();}}>체납</button>{' '}
            <button className="btn outline" onClick={async()=>{await fetch(`${API}/admin/taxes/${r.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${session.token}`}}); fetchMine();}}>삭제</button>
          </td></tr>
        ))}
      </tbody>
    </table>
  </div>);
}

function Users({session}){
  const [list,setList]=useState([]);
  const [form,setForm]=useState({student_id:'',name:'',role:'student',password:''});
  const fetchList=()=>fetch(`${API}/admin/users`,{headers:{Authorization:`Bearer ${session.token}`}}).then(r=>r.json()).then(setList);
  useEffect(fetchList,[]);
  return (<div>
    <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
      <input placeholder="학번/아이디" value={form.student_id} onChange={e=>setForm({...form,student_id:e.target.value})}/>
      <input placeholder="이름" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="student">학생</option><option value="admin">admin</option></select>
      <input type="password" placeholder="비밀번호" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
      <button className="btn" onClick={async()=>{
        await fetch(`${API}/admin/users`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.token}`},body:JSON.stringify(form)});
        setForm({student_id:'',name:'',role:'student',password:''}); fetchList();
      }}>추가</button>
    </div>
    <table width="100%">
      <thead><tr><th>학번</th><th>이름</th><th>권한</th><th>생성일</th><th/></tr></thead>
      <tbody>{list.map(u=>(<tr key={u.id}><td>{u.student_id}</td><td>{u.name}</td><td>{u.role}</td><td>{new Date(u.created_at).toLocaleString()}</td>
        <td><button className="btn outline" onClick={async()=>{await fetch(`${API}/admin/users/${u.student_id}`,{method:'DELETE',headers:{Authorization:`Bearer ${session.token}`}}); fetchList();}}>삭제</button></td></tr>))}</tbody>
    </table>
  </div>);
}
