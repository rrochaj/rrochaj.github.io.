// main.js - gerencia usuários, autorização e estoque via localStorage
(function(){
  // helpers
  function load(key){ return JSON.parse(localStorage.getItem(key) || 'null'); }
  function save(key,val){ localStorage.setItem(key, JSON.stringify(val)); }
  function getUsers(){ return load('users') || []; }
  function setUsers(u){ save('users', u); }
  function getStock(){ return Number(localStorage.getItem('stock') || 0); }
  function setStock(n){ localStorage.setItem('stock', String(n)); }
  function getHistory(){ return load('history') || []; }
  function addHistory(entry){ const h = getHistory(); h.unshift(entry); save('history', h); }

  // garante admin padrão
  (function ensureAdmin(){
    const users = getUsers();
    if(!users.find(u=>u.email==='admin@local')) {
      users.push({
        nome: 'Admin',
        email: 'admin@local',
        pass: 'admin123',
        authorized: true,
        isAdmin: true
      });
      setUsers(users);
    }
  })();

  // Páginas: index.html (login/register)
  if(document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');
    const loginMsg = document.getElementById('loginMsg');
    const regMsg = document.getElementById('regMsg');

    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pass = document.getElementById('loginPassword').value;
      const u = getUsers().find(x=>x.email===email && x.pass===pass);
      if(!u){ loginMsg.textContent = 'Credenciais inválidas.'; return; }
      if(!u.authorized){ loginMsg.textContent = 'Aguardando autorização do administrador.'; return; }
      localStorage.setItem('currentUser', JSON.stringify({email:u.email, nome:u.nome}));
      location.href = 'app.html';
    });

    regForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const nome = document.getElementById('regNome').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const pass = document.getElementById('regPass').value;
      const users = getUsers();
      if(users.find(x=>x.email===email)){ regMsg.textContent = 'E-mail já cadastrado.'; return; }
      users.push({ nome, email, pass, authorized:false, isAdmin:false });
      setUsers(users);
      regMsg.textContent = 'Cadastro realizado. Aguarde autorização do administrador.';
      regForm.reset();
    });
  }

  // Admin page
  if(document.getElementById('adminLoginForm')) {
    const adminForm = document.getElementById('adminLoginForm');
    const adminMsg = document.getElementById('adminMsg');
    const adminArea = document.getElementById('adminArea');
    const pendingList = document.getElementById('pendingList');
    const stockValue = document.getElementById('stockValue');
    const adjustBtn = document.getElementById('adjustBtn');
    const adjustAmount = document.getElementById('adjustAmount');
    const historyDiv = document.getElementById('history');

    function renderPending(){
      const users = getUsers();
      pendingList.innerHTML = '';
      users.filter(u=>!u.authorized).forEach(u=>{
        const div = document.createElement('div');
        div.textContent = `${u.nome} — ${u.email} `;
        const apro = document.createElement('button'); apro.textContent='Autorizar';
        apro.onclick = ()=>{
          u.authorized = true; setUsers(users); renderPending(); renderHistory();
        };
        const del = document.createElement('button'); del.textContent='Remover';
        del.onclick = ()=>{
          const idx = users.indexOf(u); users.splice(idx,1); setUsers(users); renderPending(); renderHistory();
        };
        div.appendChild(apro); div.appendChild(del);
        pendingList.appendChild(div);
      });
      if(pendingList.children.length===0) pendingList.textContent='Nenhum usuário pendente.';
    }

    function renderHistory(){
      stockValue.textContent = getStock();
      const hist = getHistory();
      historyDiv.innerHTML = hist.slice(0,20).map(h=>`<div>${h.when} — ${h.type} — ${h.qtd} — ${h.info || ''}</div>`).join('') || 'Sem registros.';
    }

    adminForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = document.getElementById('adminEmail').value.trim();
      const pass = document.getElementById('adminPass').value;
      const u = getUsers().find(x=>x.email===email && x.pass===pass && x.isAdmin);
      if(!u){ adminMsg.textContent = 'Credenciais admin inválidas.'; return; }
      adminMsg.textContent = '';
      adminForm.style.display='none';
      adminArea.style.display='block';
      renderPending();
      renderHistory();
    });

    adjustBtn.addEventListener('click', ()=>{
      const val = Number(adjustAmount.value||0);
      const newStock = getStock()+val;
      setStock(newStock);
      addHistory({ when:new Date().toLocaleString(), type:'Ajuste', qtd:val, info:'Ajuste manual admin'});
      renderHistory();
    });

    document.getElementById('logoutAdmin').addEventListener('click', ()=>{
      location.href='index.html';
    });
  }

  // app.html (painel do usuário)
  if(document.getElementById('greeting')) {
    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if(!cur){ location.href='index.html'; return; }
    document.getElementById('greeting').textContent = 'Olá, ' + cur.nome;
    document.getElementById('currentStock').textContent = getStock();
    document.getElementById('logout').addEventListener('click', ()=>{
      localStorage.removeItem('currentUser');
      location.href='index.html';
    });
  }

  // entrada.html
  if(document.getElementById('entradaForm')) {
    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if(!cur){ location.href='index.html'; return; }
    const form = document.getElementById('entradaForm');
    const msg = document.getElementById('entradaMsg');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const qtd = Number(document.getElementById('entradaQtd').value || 0);
      const origem = document.getElementById('entradaOrigem').value;
      const obs = document.getElementById('entradaObs').value;
      if(qtd<=0){ msg.textContent='Quantidade inválida.'; return; }
      const newStock = getStock() + qtd;
      setStock(newStock);
      addHistory({ when:new Date().toLocaleString(), type:'Entrada', qtd, info:origem+' - '+obs, by:cur.email });
      msg.textContent = 'Entrada registrada. Saldo: ' + newStock;
      form.reset();
    });
  }

  // saida.html
  if(document.getElementById('saidaForm')) {
    const cur = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if(!cur){ location.href='index.html'; return; }
    const form = document.getElementById('saidaForm');
    const msg = document.getElementById('saidaMsg');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const qtd = Number(document.getElementById('saidaQtd').value || 0);
      const para = document.getElementById('saidaPara').value;
      const obs = document.getElementById('saidaObs').value;
      if(qtd<=0){ msg.textContent='Quantidade inválida.'; return; }
      const stock = getStock();
      if(qtd > stock){ msg.textContent='Saldo insuficiente. Saldo atual: '+stock; return; }
      const newStock = stock - qtd;
      setStock(newStock);
      addHistory({ when:new Date().toLocaleString(), type:'Saída', qtd, info:para+' - '+obs, by:cur.email });
      msg.textContent = 'Saída registrada. Saldo: ' + newStock;
      form.reset();
    });
  }

})();

