// BOTÕES QUE ABREM O POP-UP
const btn1 = document.getElementById("agendar");
const btn2 = document.getElementById("agendar2");

const popup = document.querySelector(".popup");
const overlay = document.querySelector(".overlay");

// ABRIR POP-UP
function abrirPopup() {
  overlay.style.display = "block";
  popup.classList.add("ativo");
}

if (btn1) btn1.onclick = abrirPopup;
if (btn2) btn2.onclick = abrirPopup;

// FECHAR POP-UP AO CLICAR NO FUNDO
overlay.onclick = () => {
  popup.classList.remove("ativo");
  setTimeout(() => {
    overlay.style.display = "none";
  }, 250);
};

// CONFIRMAR AGENDAMENTO
document.getElementById("confirmar").onclick = () => {
  const barbeiro = document.getElementById("barbeiro").value;
  const data = document.getElementById("data").value;
  const hora = document.getElementById("hora").value;
  const nome = document.getElementById("nomeCliente").value;

  if (!barbeiro || !data || !hora || !nome) {
    alert("Preencha tudo!");
    return;
  }

  const caminho = `${data}_${hora}_${barbeiro}`;
  const refAgendamento = _ref(_db, "agendamentos/" + caminho);

  _get(refAgendamento).then(snap => {
    if (snap.exists()) {
      alert("Esse horário já está ocupado!");
    } else {
      _set(refAgendamento, {
        nome: nome,
        barbeiro: barbeiro,
        data: data,
        hora: hora
      }).then(() => {
        alert("Agendado com sucesso!");

        popup.classList.remove("ativo");
        setTimeout(() => {
          overlay.style.display = "none";
        }, 250);
      });
    }
  });
};
