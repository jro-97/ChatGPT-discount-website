const qs = s => document.querySelector(s);
const showBtn = qs('#show-codes');
const helpBtn = qs('#how');
const codesCard = qs('#codes-card');
const codesDiv = qs('#codes');
const updatedP = qs('#updated');

function slug(s){
  return s.toLowerCase().replace(/https?:\/\/(www\.)?/,'').replace(/[^\w.-]+/g,'');
}

async function loadCodes(){
  try{
    const res = await fetch('codes.json?cachebust=' + Date.now());
    if(!res.ok) throw new Error('codes.json missing');
    return await res.json();
  }catch(e){ return { updated:null, items:[] }; }
}

showBtn.addEventListener('click', async ()=>{
  const store = qs('#store').value.trim();
  const country = qs('#country').value.trim();
  const data = await loadCodes();
  const want = slug(store || '');
  const list = (data.items||[]).filter(it => !want || (slug(it.store||'').includes(want) || (it.for||'').includes(want)));
  codesDiv.innerHTML = '';
  if(!list.length){
    codesDiv.innerHTML = '<p class="hint">No entries yet. Run the GitHub Action to fetch codes.</p>';
  } else {
    const ul = document.createElement('ul');
    list.forEach(it => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${it.code}</strong> <span class="hint">(${it.source}${it.note? ' – '+it.note:''})</span>`;
      ul.appendChild(li);
    });
    codesDiv.appendChild(ul);
  }
  updatedP.textContent = data.updated ? ('Last updated: ' + new Date(data.updated).toLocaleString()) : '';
  codesCard.hidden = false;
});

helpBtn.addEventListener('click', ()=> document.querySelector('#help').hidden = false);
