(() => {
 const form=document.querySelector('#contact-form,[data-demo-form]');
 if(!form)return;
 const garage=form.id==='contact-form';
 const titles=garage?['Jakie auto?','Co się dzieje?','Jak się z Tobą skontaktować?']:['Czego potrzebujesz?','Kilka szczegółów','Jak się z Tobą skontaktować?'];
 const labels=garage?['Auto','Problem','Kontakt']:['Potrzeba','Szczegóły','Kontakt'];
 const getLabel=name=>form.querySelector('[name="'+name+'"]')?.closest('label');
 const groups=garage?[[getLabel('car')],[getLabel('problem')],[form.querySelector('.form-row')]]:[[getLabel('service')],[...form.querySelectorAll('[data-for]'),getLabel('description')],[null,getLabel('contact')]];
 // Contact rows are direct children; conditional detail rows remain in their fieldsets.
 if(!garage)groups[2][0]=[...form.children].find(el=>el.classList.contains('form-row'));
 const progress=document.createElement('ol');progress.className='form-progress';progress.setAttribute('aria-label','Etapy formularza');
 labels.forEach((label,i)=>{const li=document.createElement('li');li.textContent=(i+1)+'. '+label;progress.append(li);});
 const anchor=form.querySelector('.form-demo');if(anchor)anchor.after(progress);else form.prepend(progress);
 const panels=groups.map((nodes,i)=>{const section=document.createElement('section');section.className='form-step';section.setAttribute('aria-labelledby','form-step-title-'+i);const title=document.createElement('h3');title.className='form-step-title';title.id='form-step-title-'+i;title.tabIndex=-1;title.textContent=titles[i];section.append(title);nodes.filter(Boolean).forEach(node=>section.append(node));progress.after(section);return section;});
 // Insert in reading order after the progress indicator.
 let previous=progress;panels.forEach(panel=>{previous.after(panel);previous=panel;});
 const submit=form.querySelector('[type="submit"]');
 const actions=document.createElement('div');actions.className='form-actions';
 const back=document.createElement('button');back.type='button';back.className='form-back';back.textContent='← Wstecz';
 const next=document.createElement('button');next.type='button';next.className='button';next.textContent='Dalej →';
 actions.append(back,next,submit);panels.at(-1).after(actions);
 let current=0;form.noValidate=true;
 function show(index,focus=true){current=index;panels.forEach((panel,i)=>panel.hidden=i!==index);[...progress.children].forEach((li,i)=>{if(i===index)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});back.hidden=index===0;next.hidden=index===panels.length-1;submit.hidden=index!==panels.length-1;if(focus)panels[index].querySelector('h3').focus();}
 const invalid=scope=>[...scope.querySelectorAll('input,select,textarea')].find(el=>!el.disabled&&!el.checkValidity());
 function advance(){const field=invalid(panels[current]);if(field){field.reportValidity();return;}show(current+1);}
 back.addEventListener('click',()=>show(current-1));next.addEventListener('click',advance);
 form.addEventListener('submit',event=>{if(current<panels.length-1){event.preventDefault();event.stopImmediatePropagation();advance();return;}const field=invalid(form);if(field){event.preventDefault();event.stopImmediatePropagation();show(panels.findIndex(panel=>panel.contains(field)));field.reportValidity();}},true);
 const stickyCTA=document.querySelector('.mobile-cta');
 if(stickyCTA&&'IntersectionObserver'in window)new IntersectionObserver(entries=>stickyCTA.classList.toggle('form-in-view',entries[0].isIntersecting),{threshold:0}).observe(form);
 show(0,false);
})();
