
import './globals.css';
import Image from 'next/image';
import Link from 'next/link';
export const metadata = { title:'HOTAX — 2025. 진해용원고 2-3 국세청', description:'학급 세입 현황, 공지, 납세 조회'};
export default function RootLayout({children}){
  return (<html lang="ko"><body>
    <nav className="nav">
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <Image src="/logo.png" width={36} height={36} alt="HOTAX" className="logo"/>
        <Link href="/">HOTAX</Link>
      </div>
      <div style={{display:'flex',gap:8}} className="no-print">
        <Link href="/tax">납세 조회</Link>
        <Link href="/admin">업무 포털</Link>
      </div>
    </nav>
    <div className="container">{children}</div>
  </body></html>);
}
