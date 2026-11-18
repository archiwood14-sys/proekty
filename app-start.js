(function(){
"use strict";
try{const t=localStorage.getItem('av-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}
const $=id=>document.getElementById(id);
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const hex=buf=>Array.from(new Uint8Array(buf),x=>x.toString(16).padStart(2,'0')).join('');
async function otkryt(login,parol,chast){
  const imya=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('archiwood:'+login.trim().toLowerCase()+(chast?'|'+chast:'')))).slice(0,24);
  const r=await fetch('data/'+imya+'.enc',{cache:'no-store'});
  if(!r.ok)throw new Error('net');
  const f=await r.json();
  if(f.v!==1||!(f.iter>=600000))throw new Error('format');
  const bazovyj=await crypto.subtle.importKey('raw',new TextEncoder().encode(parol),'PBKDF2',false,['deriveKey']);
  const kl=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:b64(f.salt),iterations:f.iter},bazovyj,{name:'AES-GCM',length:256},false,['decrypt']);
  const szh=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(f.iv)},kl,b64(f.ct));
  const potok=new Blob([szh]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(potok).text());
}
// замок при бездействии: 30 минут без действий — данные стираются из памяти, снова вход
function zamok(){
  const MIN=30;let t;
  const sbros=()=>{clearTimeout(t);t=setTimeout(()=>{window.__D=null;location.reload();},MIN*60000);};
  ['pointerdown','keydown','scroll','touchstart'].forEach(e=>addEventListener(e,sbros,{passive:true}));
  sbros();
}
$('vh-forma').addEventListener('submit',async e=>{
  e.preventDefault();
  const kn=$('vh-knopka');kn.disabled=true;kn.textContent='Открываю…';$('vh-osh').textContent='';
  try{
    const login=$('vh-login').value,parol=$('vh-parol').value;
    const P=await otkryt(login,parol);
    $('vh-parol').value='';
    // «Деньги» (К14): отдельный файл, ключ = пароль + PIN. Пароль остаётся только в памяти этой вкладки до выхода/замка.
    let popytok=0;
    window.__dengi=async pin=>{
      if(popytok>=5)throw new Error('zamok');
      try{return await otkryt(login,parol+'|'+pin,'dengi');}
      catch(x){popytok++;if(popytok>=5)setTimeout(()=>{window.__D=null;location.reload();},1500);throw new Error(popytok>=5?'zamok':'pin');}
    };
    window.__D=P.D;
    $('vhod').remove();$('prilozhenie').hidden=false;
    const u=URL.createObjectURL(new Blob([P.APP],{type:'text/javascript'}));
    const s=document.createElement('script');s.src=u;s.onload=()=>URL.revokeObjectURL(u);document.body.appendChild(s);
    zamok();
  }catch(x){
    $('vh-osh').textContent='Неверный логин или пароль';
    kn.disabled=false;kn.textContent='Войти';
  }
});
})();
