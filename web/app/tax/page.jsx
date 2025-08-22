
'use client';
import { useEffect, useState } from 'react';
import { API } from '../api';
export default function Page(){
  const [rows,setRows]=useState([]); const [status,setStatus]=useState(''); const [sort,setSort]=useState('date_desc');
  useEffect(()=>{
    const session = JSON.parse(localStorage.getItem('hotax_session')||'null'); if(!session) return;
    const qs = new URLSearchParams({ status, sort }).toString();
    fetch(`${API}/me/taxes?${qs}`,{headers:{Authorization:`Bearer ${session.token}`}}).then(r=>r.json()).then(setRows);
  },[status,sort]);
  const session = JSON.parse(typeof window!=='undefined'?(localStorage.getItem('hotax_session')||'null'):'null');
  return (<div className="card"><h2>납세 조회</h2>
    {!session && <div>로그인 후 이용 가능합니다.</div>}
    {session && (<div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <select value={status} onChange={e=>setStatus(e.target.value)}><option value="">전체 상태</option><option>미납</option><option>체납</option><option>납부</option></select>
        <select value={sort} onChange={e=>setSort(e.target.value)}><option value="date_desc">날짜 내림차순</option><option value="date_asc">날짜 오름차순</option></select>
      </div>
      <table width="100%"><thead><tr><th>항목</th><th>세액</th><th>부과일</th><th>상태</th><th>비고</th></tr></thead><tbody>
        {rows.map(r=>{ let remark = r.status==='체납' && r.delinquent_on?`체납일: ${r.delinquent_on}`:''; if(r.status==='납부'&&r.paid_on) remark=`납부일: ${r.paid_on}`;
          return (<tr key={r.id}><td>{r.item}</td><td>{r.amount.toLocaleString()}원</td><td>{r.imposed_on}</td><td><span className={`badge ${r.status}`}>{r.status}</span></td><td>{remark}</td></tr>)
        })}
      </tbody></table>
    </div>)}
  </div>);
}
