async function jget(u){ const r=await fetch(u); if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }
async function jpost(u,b){ const r=await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}); const t=await r.text(); try{ return JSON.parse(t);}catch{ if(!r.ok) throw new Error(t); return t; } }

async function refresh(){
  const lots = await jget('/api/stock');
  const tb = document.querySelector('#tblLots tbody'); tb.innerHTML='';
  lots.forEach(l=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${l.sku}</td><td>${l.name}</td><td>${l.qty}</td><td>${l.batch||'-'}</td><td>${l.location||'-'}</td><td>${l.received_at.slice(0,10)}</td><td>${l.expiry||'-'}</td><td>${l.status}</td><td><button class="btn btn-sm btn-outline-danger" onclick="delLot('${l.id}')">Del</button></td>`;
    tb.appendChild(tr);
  });
  const sum = await jget('/api/summary');
  const sb = document.querySelector('#tblSum tbody'); sb.innerHTML='';
  sum.forEach(s=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td>${s.sku}</td><td>${s.name}</td><td>${s.qty}</td><td>${s.lots}</td><td>${s.soonest_expiry||'-'}</td>`; sb.appendChild(tr); });
  const hist = await jget('/api/history');
  const hb = document.querySelector('#tblHist tbody'); hb.innerHTML='';
  hist.slice().reverse().forEach(h=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${h.type}</td><td>${h.sku}</td><td>${h.qty}</td><td><code>${JSON.stringify(h.details||{})}</code></td><td>${new Date(h.ts).toLocaleString()}</td>`; hb.appendChild(tr); });
}

async function inbound(){
  const sku=document.getElementById('in_sku').value.trim(); const name=document.getElementById('in_name').value.trim(); const qty=Number(document.getElementById('in_qty').value||0); const batch=document.getElementById('in_batch').value.trim()||null; const expiry=document.getElementById('in_exp').value||null; const loc=document.getElementById('in_loc').value.trim()||'DEFAULT';
  if(!sku||!name||!qty){alert('Fill SKU, name and qty');return;}
  await jpost('/api/inbound',{sku,name,qty,batch,expiry,location:loc}); document.getElementById('in_qty').value=''; document.getElementById('in_sku').value=''; document.getElementById('in_name').value=''; refresh();
}

async function outbound(){
  const sku=document.getElementById('out_sku').value.trim(); const qty=Number(document.getElementById('out_qty').value||0); const mode=document.getElementById('out_mode').value; const minDays=document.getElementById('out_minDays').value ? Number(document.getElementById('out_minDays').value) : undefined;
  if(!sku||!qty){alert('Fill SKU and qty');return;}
  try{
    const res = await jpost('/api/outbound',{sku,qty,mode,minDaysToExpiry:minDays});
    document.getElementById('out_result').textContent = 'Picked '+res.qty+' — ' + res.picks.map(p=>`${p.batch||p.lotId}×${p.qty}`).join(', ');
    document.getElementById('out_qty').value=''; document.getElementById('out_sku').value='';
  }catch(e){
    alert('Pick failed: '+(e.message||e));
  }
  refresh();
}

async function delLot(id){ if(!confirm('Delete lot?')) return; const r=await fetch('/api/stock/'+id,{method:'DELETE'}); if(!r.ok){ alert('Failed'); return; } refresh(); }

document.getElementById('btnInbound').addEventListener('click', inbound);
document.getElementById('btnOutbound').addEventListener('click', outbound);
document.getElementById('btnSeed').addEventListener('click', async ()=>{ await jpost('/api/reset',{}); refresh(); });

refresh();
