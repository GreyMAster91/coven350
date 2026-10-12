/* ===== НАСТРОЙКИ (заполните, см. README.md) ===== */
const CONFIG = {
  TG_BOT_TOKEN: '',   // токен бота от @BotFather, например '123456:ABC...'
  TG_CHAT_ID: '',     // ваш chat id (число) из getUpdates
  EVENT_START: '2026-11-13T18:00:00+03:00',
  EVENT_END:   '2026-11-14T03:00:00+03:00'
};
/* ================================================= */

// Countdown
(function(){
  const target = new Date(CONFIG.EVENT_START).getTime();
  const el = id => document.getElementById(id);
  const pad = n => String(n).padStart(2,'0');
  function tick(){
    let s = Math.max(0, Math.floor((target - Date.now())/1000));
    el('cd-d').textContent = Math.floor(s/86400);
    el('cd-h').textContent = pad(Math.floor(s%86400/3600));
    el('cd-m').textContent = pad(Math.floor(s%3600/60));
    el('cd-s').textContent = pad(s%60);
  }
  tick(); setInterval(tick, 1000);
})();

// Slider dots
(function(){
  const slider = document.getElementById('slider'), dots = document.getElementById('dots');
  const cards = [...slider.children];
  cards.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Образ '+(i+1));
    b.onclick=()=>slider.scrollTo({left:c.offsetLeft-(slider.clientWidth-c.clientWidth)/2,behavior:'smooth'});dots.appendChild(b);});
  function upd(){const mid=slider.scrollLeft+slider.clientWidth/2;let best=0,bd=1e9;
    cards.forEach((c,i)=>{const d=Math.abs(c.offsetLeft+c.clientWidth/2-mid);if(d<bd){bd=d;best=i}});
    [...dots.children].forEach((d,i)=>d.classList.toggle('on',i===best));}
  slider.addEventListener('scroll',()=>requestAnimationFrame(upd),{passive:true}); upd();
})();

// ICS
function buildICS(){
  const L = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Coven350//RU','CALSCALE:GREGORIAN','METHOD:PUBLISH',
    'BEGIN:VTIMEZONE','TZID:Europe/Moscow','BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:+0300','TZOFFSETTO:+0300','TZNAME:MSK','END:STANDARD','END:VTIMEZONE',
    'BEGIN:VEVENT','UID:coven350-20261113@coven350',
    'DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,''),
    'DTSTART;TZID=Europe/Moscow:20261113T180000','DTEND;TZID=Europe/Moscow:20261114T030000',
    'SUMMARY:† 350 лет Графине — Ковен пробуждается',
    'LOCATION:Лофт «Мск Плейс»\\, ул. Бакунинская\\, 72с2\\, Москва',
    'DESCRIPTION:Дресс-код: Vampire Noir & Gothic Glamour. Сбор в 18:00.',
    'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Завтра пробуждение Ковена: 350 лет Графине','TRIGGER:-P1D','END:VALARM',
    'END:VEVENT','END:VCALENDAR'];
  return L.join('\r\n')+'\r\n';
}
document.getElementById('ics').addEventListener('click',()=>{
  const blob = new Blob([buildICS()],{type:'text/calendar;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'coven350.ics';
  document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
});

// RSVP
document.getElementById('form').addEventListener('submit', async e=>{
  e.preventDefault();
  const f = e.target, err = document.getElementById('err'), btn = document.getElementById('submit');
  const names = f.names.value.trim(), statusEl = f.querySelector('input[name=status]:checked');
  const drinks = [...f.querySelectorAll('input[name=drinks]:checked')].map(i=>i.value);
  const track = f.track.value.trim();
  if(!names){err.textContent='Назови себя, смертный.';f.names.focus();return}
  if(!statusEl){err.textContent='Выбери статус присутствия.';return}
  err.textContent='';
  const coming = statusEl.value.startsWith('Клянусь');
  const text = `🦇 Новая присяга: ${names}\nСтатус: ${statusEl.value}\nПьют: ${drinks.length?drinks.join(', '):'—'}\nТрек: ${track||'—'}`;
  btn.disabled = true; btn.textContent = 'Скрепляем…';
  if(CONFIG.TG_BOT_TOKEN && CONFIG.TG_CHAT_ID){
    try{
      const r = await fetch(`https://api.telegram.org/bot${CONFIG.TG_BOT_TOKEN}/sendMessage`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({chat_id:CONFIG.TG_CHAT_ID,text})});
      if(!r.ok) throw new Error('HTTP '+r.status);
    }catch(x){
      console.warn('Telegram send failed', x);
      btn.disabled=false; btn.textContent='Скрепить клятву кровью';
      err.textContent='Ворон не долетел. Попробуй ещё раз или напиши хозяйке вечера.'; return;
    }
  } else {
    console.info('[RSVP] Telegram не настроен (TG_BOT_TOKEN/TG_CHAT_ID пусты). Сообщение:\n'+text);
  }
  f.hidden = true;
  const t = document.getElementById('thanks'); t.hidden = false;
  if(!coming){t.querySelector('h3').textContent='Солнце неумолимо';
    document.getElementById('thanks-text').textContent='Жаль, что лучи настигли тебя. Ковен поднимет кубок и в твою честь.';}
  t.scrollIntoView({behavior:'smooth',block:'center'});
});
