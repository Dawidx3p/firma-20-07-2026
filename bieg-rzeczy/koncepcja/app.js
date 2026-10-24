const form=document.querySelector('#contact-form');
const dialog=document.querySelector('#form-dialog');
let returnFocus;
form?.addEventListener('submit',event=>{
 event.preventDefault();
 returnFocus=document.activeElement;
 dialog.showModal();
 document.body.classList.add('dialog-open');
 dialog.querySelector('[data-close-dialog]').focus();
});
dialog?.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
dialog?.addEventListener('click',event=>{
 if(event.target!==dialog)return;
 const r=dialog.getBoundingClientRect();
 if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
});
dialog?.addEventListener('close',()=>{document.body.classList.remove('dialog-open');returnFocus?.focus({preventScroll:true});});
document.addEventListener('keydown',event=>{
 if(!dialog?.open||event.key!=='Tab')return;
 const controls=[...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),[tabindex="0"]')];
 const first=controls[0],last=controls.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
