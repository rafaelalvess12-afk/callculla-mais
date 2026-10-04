'use strict';
const ACCESS_PASSWORD='74926', USERS_KEY='calculamais_users_zero', CASES_KEY='calculamais_cases_zero', CURRENT_KEY='calculamais_current_zero';
const $=id=>document.getElementById(id);
function read(key){try{let v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch(e){return []}}
let users=read(USERS_KEY), cases=read(CASES_KEY), current=localStorage.getItem(CURRENT_KEY), val='0', first=null, op=null, waiting=false;
const norm=s=>String(s||'').trim().toLocaleLowerCase('pt-BR');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const saveUsers=()=>localStorage.setItem(USERS_KEY,JSON.stringify(users));
const saveCases=()=>localStorage.setItem(CASES_KEY,JSON.stringify(cases));
function notify(s){let n=$('notification');n.textContent=s;n.classList.add('show');clearTimeout(window.noteTimer);window.noteTimer=setTimeout(()=>n.classList.remove('show'),2600)}
function screen(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(id).classList.add('active')}
function updateDisplay(){$('display').textContent=val}
function clearCalculator(){val='0';first=null;op=null;waiting=false;updateDisplay()}
function number(n){if(waiting){val=n;waiting=false}else val=val==='0'?n:val+n;if(val.length>16)val=val.slice(0,16);updateDisplay()}
function decimal(){if(waiting){val='0.';waiting=false}else if(!val.includes('.'))val+='.';updateDisplay()}
function calc(a,b,o){return o==='+'?a+b:o==='-'?a-b:o==='*'?a*b:o==='/'?(b===0?NaN:a/b):b}
function operator(o){if(!Number.isFinite(Number(val)))return clearCalculator();if(op&&!waiting){let r=calc(first,Number(val),op);if(!Number.isFinite(r)){val='Erro';first=null;op=null;waiting=true;updateDisplay();return}val=String(Number(r.toPrecision(12)));updateDisplay()}else first=Number(val);op=o;waiting=true}
function equals(){if(op){let r=calc(first,Number(val),op);val=Number.isFinite(r)?String(Number(r.toPrecision(12))):'Erro';first=null;op=null;waiting=true;updateDisplay()}else if(val===ACCESS_PASSWORD){clearCalculator();$('loginName').value='';$('loginPassword').value='';screen('loginScreen')}}
function percent(){let n=Number(val);if(Number.isFinite(n))val=String(n/100);updateDisplay()}
function deleteNumber(){if(waiting||val==='Erro')return clearCalculator();val=val.length>1?val.slice(0,-1):'0';if(val==='-')val='0';updateDisplay()}
function backToCalculator(){clearCalculator();screen('calculatorScreen')}
function createAccount(){let name=$('loginName').value.trim();if(name.length<2)return notify('Digite um nome com pelo menos 2 caracteres.');if(users.some(u=>norm(u.name)===norm(name)))return notify('Esse nome já existe. Entre com sua senha.');let chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789',password='';for(let i=0;i<10;i++)password+=chars[Math.floor(Math.random()*chars.length)];let user={id:Date.now(),name,password,role:['lloyd','kai'].includes(norm(name))?'Administrador':'Investigador'};users.push(user);saveUsers();$('generatedPassword').innerHTML='<b>Guarde sua senha:</b><br><code>'+esc(password)+'</code><br><small>Esta versão de demonstração guarda dados neste navegador.</small>';$('generatedPassword').classList.remove('hidden');$('loginPassword').value=password;notify('Conta criada! Guarde sua senha.');setTimeout(()=>openCentral(user),1700)}
function login(){let name=$('loginName').value.trim(),pass=$('loginPassword').value,user=users.find(u=>norm(u.name)===norm(name)&&u.password===pass);if(!user)return notify('Nome ou senha incorretos.');openCentral(user)}
function openCentral(u){current=u.name;localStorage.setItem(CURRENT_KEY,current);$('currentUserName').textContent=u.name;$('welcomeName').textContent=u.name;$('profileName').textContent=u.name;$('profileRole').textContent=u.role;screen('centralScreen');showSection('home');updateDashboard();updateCases();updateTeam()}
function showSection(s){document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));$('section-'+s).classList.add('active')}
function openInvestigationForm(){$('investigationForm').classList.remove('hidden');$('investigationTitle').focus()}
function closeInvestigationForm(){$('investigationForm').classList.add('hidden');$('investigationTitle').value='';$('investigationClient').value='';$('investigationDescription').value=''}
function createInvestigation(){let title=$('investigationTitle').value.trim(),client=$('investigationClient').value.trim(),description=$('investigationDescription').value.trim();if(!current)return notify('Entre na sua conta primeiro.');if(!title||!description)return notify('Preencha o título e a descrição.');cases.unshift({id:Date.now(),title,client,description,creator:current,status:'Em andamento',date:new Date().toISOString()});saveCases();closeInvestigationForm();updateCases();updateDashboard();notify('Investigação criada!')}
function finalizeInvestigation(id){let c=cases.find(x=>x.id===id);if(!c)return notify('Investigação não encontrada.');if(c.status!=='Em andamento')return notify('Essa investigação já foi finalizada.');if(c.creator!==current&&!['lloyd','kai'].includes(norm(current)))return notify('Somente o criador ou administradores podem finalizar.');if(!confirm('Tem certeza que deseja finalizar esta investigação?'))return;c.status='Concluída';c.completedAt=new Date().toISOString();saveCases();updateCases();updateDashboard();notify('Investigação finalizada!')}
function updateCases(){let box=$('investigationList');if(!cases.length){box.innerHTML='<p class="case">Nenhuma investigação ainda. Clique em “Nova investigação” para começar.</p>';return}box.innerHTML=cases.map(c=>{let done=c.status==='Concluída',date=new Date(c.date).toLocaleDateString('pt-BR'),button=!done&&(c.creator===current||['lloyd','kai'].includes(norm(current)))?'<button class="main" onclick="finalizeInvestigation('+Number(c.id)+')">FINALIZAR INVESTIGAÇÃO</button>':'';return '<article class="case"><h3>'+esc(c.title)+'</h3><small>Criador: '+esc(c.creator)+' · Data: '+esc(date)+'</small>'+(c.client?'<p><b>Cliente:</b> '+esc(c.client)+'</p>':'')+'<p>'+esc(c.description)+'</p><span class="status '+(done?'done':'')+'">'+esc(c.status)+'</span><br>'+button+'</article>'}).join('')}
function updateDashboard(){$('investigationCount').textContent=cases.length;$('progressCount').textContent=cases.filter(c=>c.status==='Em andamento').length;$('completedCount').textContent=cases.filter(c=>c.status==='Concluída').length}
function updateTeam(){$('teamList').innerHTML=users.length?users.map(u=>'<div class="case">'+esc(u.name)+' <span class="status">'+esc(u.role)+'</span></div>').join(''):'<p>Nenhum usuário cadastrado ainda.</p>'}
function logout(){current=null;localStorage.removeItem(CURRENT_KEY);clearCalculator();screen('calculatorScreen');notify('Você saiu da conta.')}
clearCalculator();
if(current){let u=users.find(x=>norm(x.name)===norm(current));if(u)openCentral(u);else localStorage.removeItem(CURRENT_KEY)}
