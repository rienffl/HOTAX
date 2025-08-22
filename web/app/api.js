
export const API = process.env.NEXT_PUBLIC_API_URL;
export async function api(path, opts={}){
  const res = await fetch(`${API}${path}`, { cache:'no-store', ...opts, headers:{ 'Content-Type':'application/json', ...(opts.headers||{}) } });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}
