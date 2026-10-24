let returnFocus;
function openDialog(dialog){returnFocus=document.activeElement;dialog.showModal();document.body.classList.add('modal-open');dialog.querySelector('[data-close]')?.focus();}
document.querySelectorAll('dialog:not([data-navigation-dialog])').forEach(dialog=>{
 dialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');returnFocus?.focus({preventScroll:true});});
});
document.addEventListener('keydown',e=>{const d=document.querySelector('dialog[open]:not([data-navigation-dialog])');if(!d||e.key!=='Tab')return;const list=[...d.querySelectorAll('button,a[href],input,textarea,select')].filter(x=>!x.disabled);const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
const form=document.querySelector('[data-demo-form]');
const service=form?.querySelector('[name=service]');
function updateGroups(){if(!service)return;form.querySelectorAll('[data-for]').forEach(group=>{const show=group.dataset.for.split(',').includes(service.value);group.hidden=!show;group.querySelectorAll('input,select,textarea').forEach(i=>i.disabled=!show);});}
if(service){const initial=new URLSearchParams(location.search).get('zakres');if([...service.options].some(o=>o.value===initial))service.value=initial;service.addEventListener('change',updateGroups);updateGroups();}
form?.addEventListener('submit',e=>{e.preventDefault();openDialog(document.querySelector('#request-dialog'));});
const filters=document.querySelectorAll('[data-filter]');
filters.forEach(button=>button.addEventListener('click',()=>{filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));let count=0;document.querySelectorAll('[data-project]').forEach(card=>{const show=button.dataset.filter==='all'||card.dataset.project===button.dataset.filter;card.hidden=!show;if(show)count++;});const status=document.querySelector('[data-filter-status]');if(status)status.textContent=`Widoczne koncepcje: ${count}.`; }));
document.querySelectorAll('[data-gallery]').forEach(button=>button.addEventListener('click',()=>{const d=document.querySelector('#gallery-dialog');d.querySelector('img').src=button.dataset.image;d.querySelector('img').alt=button.dataset.alt;d.querySelector('h2').textContent=button.dataset.title;d.querySelector('[data-gallery-caption]').textContent=button.dataset.caption;openDialog(d);}));
