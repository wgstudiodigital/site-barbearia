// ===== TOAST (bonito) =====
function showToast(msg, type = "ok") {
  const el = document.getElementById("toast");
  if (!el) {
    // fallback se você ainda não criou o toast no HTML
    alert(msg);
    return;
  }
  el.textContent = msg;
  el.classList.remove("hidden", "ok", "err");
  el.classList.add(type);

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.add("hidden"), 2600);
}

// ===== HELPERS =====
function pad(n) {
  return String(n).padStart(2, "0");
}

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

// ===== REGRAS =====
const OPEN_MIN = 8 * 60;     // 08:00
const CLOSE_MIN = 20 * 60;   // 20:00
const STEP_MIN = 20;         // opções do select (10 ou 20)
const BLOCK_MIN = 60;        // bloqueio total (40–60 min que você quer)

// ===== BOTÕES QUE ABREM O POP-UP =====
const btn1 = document.getElementById("agendar");
const btn2 = document.getElementById("agendar2");

const popup = document.querySelector(".popup");
const overlay = document.querySelector(".overlay");

// ===== ABRIR POP-UP =====
function abrirPopup() {
  if (!overlay || !popup) return;

  // Data mínima = hoje
 const dataEl = document.getElementById("data");
if (dataEl) {
  // hoje (para bloquear datas passadas)
  const now = new Date();
  const hoje = now.toISOString().split("T")[0];

  dataEl.min = hoje;
  if (!dataEl.value) dataEl.value = hoje;

  // Se hoje cair em sábado/domingo, empurra para segunda
  const day = new Date(dataEl.value + "T00:00:00").getDay();
  if (day === 0) { // domingo
    const d = new Date(dataEl.value + "T00:00:00");
    d.setDate(d.getDate() + 1);
    dataEl.value = d.toISOString().split("T")[0];
  }
  if (day === 6) { // sábado
    const d = new Date(dataEl.value + "T00:00:00");
    d.setDate(d.getDate() + 2);
    dataEl.value = d.toISOString().split("T")[0];
  }

  // Remove listener antigo (se você abre popup várias vezes)
  dataEl.onchange = () => {
    if (!dataEl.value) return;

    const d = new Date(dataEl.value + "T00:00:00");
    const dow = d.getDay(); // 0 dom, 6 sab

    if (dow === 0 || dow === 6) {
      showToast("Só dá pra agendar de segunda a sexta.", "err");
      dataEl.value = "";
      return;
    }

    // também impede escolher data anterior ao min (segurança extra)
    if (dataEl.value < hoje) {
      showToast("Não dá pra agendar no passado.", "err");
      dataEl.value = hoje;
    }
  };
}

  // Monta horários no select
  buildTimeOptions();

  overlay.style.display = "block";
  popup.classList.add("ativo");
}

if (btn1) btn1.onclick = abrirPopup;
if (btn2) btn2.onclick = abrirPopup;

// ===== FECHAR POP-UP AO CLICAR NO FUNDO =====
if (overlay) {
  overlay.onclick = () => {
    if (!popup) return;
    popup.classList.remove("ativo");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 250);
  };
}

// ===== HORÁRIOS NO SELECT =====
function buildTimeOptions() {
  const horaEl = document.getElementById("hora");
  if (!horaEl) return;

  // Você precisa trocar no HTML para <select id="hora"></select>
  if (horaEl.tagName.toLowerCase() !== "select") {
    console.warn("Troque no HTML: <input type='time' id='hora'> por <select id='hora'></select> para ficar mais fácil no celular.");
    return;
  }

  horaEl.innerHTML = "";

  // Para NÃO passar das 20:00, use CLOSE_MIN - BLOCK_MIN
  const lastStart = CLOSE_MIN - BLOCK_MIN; // recomendado

  for (let t = OPEN_MIN; t <= lastStart; t += STEP_MIN) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    const hhmm = `${pad(h)}:${pad(m)}`;

    const opt = document.createElement("option");
    opt.value = hhmm;
    opt.textContent = hhmm;
    horaEl.appendChild(opt);
  }
}

// ===== CHECAR CONFLITOS NO DIA (MESMO BARBEIRO) =====
async function hasConflictForDay(barbeiro, data, hora) {
  const start = timeToMinutes(hora);
  const end = start + BLOCK_MIN;

  const dayRef = _ref(_db, "agendamentos/");
  const snap = await _get(dayRef);
  const all = snap.val() || {};

  for (const id in all) {
    const ap = all[id];
    if (!ap) continue;

    if (ap.data !== data) continue;
    if ((ap.barbeiro || "").toLowerCase() !== (barbeiro || "").toLowerCase()) continue;

    const apStart = timeToMinutes(ap.hora);
    const apEnd = apStart + BLOCK_MIN;

    if (overlaps(start, end, apStart, apEnd)) {
      return true;
    }
  }
  return false;
}

// ===== CONFIRMAR AGENDAMENTO =====
const confirmarBtn = document.getElementById("confirmar");
if (confirmarBtn) {
  confirmarBtn.onclick = async () => {
    const barbeiro = document.getElementById("barbeiro").value;
    const data = document.getElementById("data").value;
    const d = new Date(data + "T00:00:00");
const day = d.getDay();
if (day === 0 || day === 6) {
  showToast("Agendamento só de segunda a sexta.", "err");
  return;
}
    const hora = document.getElementById("hora").value;
    // bloquear sábado/domingo no confirmar também (segurança)
const dateObj = new Date(data + "T00:00:00");
const dow = dateObj.getDay();
if (dow === 0 || dow === 6) {
  showToast("Agendamento só de segunda a sexta.", "err");
  return;
}

// bloquear horário passado (somente se a data for HOJE)
const now = new Date();
const hojeStr = now.toISOString().split("T")[0];

if (data === hojeStr) {
  const agoraMin = now.getHours() * 60 + now.getMinutes();
  const escolhidoMin = timeToMinutes(hora);

  if (escolhidoMin <= agoraMin) {
    showToast("Escolha um horário futuro (esse já passou).", "err");
    return;
  }
}
    const nome = document.getElementById("nomeCliente").value.trim();

    if (!barbeiro || !data || !hora || !nome) {
      showToast("Preencha tudo.", "err");
      return;
    }

    // regra 08:00–20:00
    const mins = timeToMinutes(hora);
    if (mins < OPEN_MIN || mins > (CLOSE_MIN - BLOCK_MIN)) {
      showToast("Agendamentos somente entre 08:00 e 20:00.", "err");
      return;
    }

    // checar conflito por intervalo (60min)
    try {
      const conflito = await hasConflictForDay(barbeiro, data, hora);
      if (conflito) {
        showToast("Horário ocupado ou muito perto de outro. Escolha outro.", "err");
        return;
      }

      // ID único (melhor do que data_hora_barbeiro)
      const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());

      const refAgendamento = _ref(_db, "agendamentos/" + id);

      await _set(refAgendamento, {
        nome,
        barbeiro,
        data,
        hora,
        status: "pendente"
      });

      showToast("Agendado com sucesso ✅", "ok");

      // fecha popup
      popup.classList.remove("ativo");
      setTimeout(() => {
        overlay.style.display = "none";
      }, 250);

      // limpa nome (opcional)
      document.getElementById("nomeCliente").value = "";

    } catch (e) {
      console.error(e);
      showToast("Erro ao agendar. Tente novamente.", "err");
    }
  };
}
