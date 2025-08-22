
'use client';
import { useEffect, useState } from 'react';
import { API } from '../../api';
export default function Page(){
  const [session,setSession]=useState(null); const [rows,setRows]=useState([]);
  const [q,setQ]=useState(''); const [status,setStatus]=useState(''); const [sort,setSort]=useState('date_desc');
  useEffect(()=>{ setSession(JSON.parse(localStorage.getItem('hotax_session')||'null')); },[]);
  useEffect(()=>{ if(!session) return; const qs=new URLSearchParams({q,status,sort}).toString(); fetch(`${API}/admin/taxes/search?${qs}`,{headers:{Authorization:`Bearer ${session.token}`}}).then(r=>r.json()).then(setRows); },[session,q,status,sort]);
  if(!session || session.user.role!=='admin') return <div className="card">관리자 전용 페이지입니다.</div>;
  function isHighDelinquent(group){ return group.filter(r=>r.status==='체납').length>=5; }
  const byStudent = rows.reduce((acc,r)=>{ (acc[r.student_id]=acc[r.student_id]||[]).push(r); return acc; },{});
  return (<div className="card print-sheet">
    <div className="no-print" style={{display:'flex',gap:8,marginBottom:12}}>
      <input placeholder="이름/학번 검색" value={q} onChange={e=>setQ(e.target.value)}/>
      <select value={status} onChange={e=>setStatus(e.target.value)}><option value="">전체 상태</option><option>미납</option><option>체납</option><option>납부</option></select>
      <select value={sort} onChange={e=>setSort(e.target.value)}><option value="date_desc">날짜 내림차순</option><option value="date_asc">날짜 오름차순</option></select>
      <button className="btn" onClick={()=>window.print()}>프린트</button>
    </div>
    {Object.entries(byStudent).map(([sid,list])=>{
      const high=isHighDelinquent(list);
      return (<div key={sid} className="card" style={{marginBottom:8,borderColor: high?'#dc2626':'#e5e7eb'}}>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <div><b>학번:</b> {sid} / <b>이름:</b> {list[0].name||''}</div>
          <div><b>비고:</b> {high?'고액체납자':'-'}</div>
        </div>
        <table width="100%"><thead><tr><th>항목</th><th>세액</th><th>부과일</th><th>상태</th><th>메모</th></tr></thead>
        <tbody>{list.map(r=>(<tr key={r.id}><td>{r.item}</td><td>{r.amount.toLocaleString()}원</td><td>{r.imposed_on}</td><td><span className={`badge ${r.status}`}>{r.status}</span></td>
          <td>{r.memo||(r.status==='납부'&&r.paid_on?`납부일: ${r.paid_on}`:r.status==='체납'&&r.delinquent_on?`체납일: ${r.delinquent_on}`:'')}</td></tr>))}</tbody></table>
      </div>);
    })}
  </div>);
}
