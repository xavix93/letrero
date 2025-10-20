// ========== Franval · Tabs/Accordion (una categoría visible) ==========

const TEMPLATE_SRC = "plantilla/plantilla_franval.png";
const VERSION = "accordion-1";

// Geometría (igual que tenías)
const GEO = {
  BANNER_LEFT:   0.12,
  BANNER_RIGHT:  0.88,
  BANNER_TOP:    0.24,
  BANNER_HEIGHT: 0.06,

  MAXW_MODEL: 1.20 * (0.88 - 0.12),
  MAXW_SUB:   0.72,
  MAXW_PRICE: 0.86,
  MAXW_DET:   0.82,

  TARGET_MODEL: 0.071,
  TARGET_SUB:   0.033,
  TARGET_PRICE: 0.137,
  TARGET_DET:   0.030,

  Y_SUB:    0.305,
  Y_PRICE:  0.440,
  Y_DETAIL: 0.500,

  MODEL_OFFSET: -0.065
};

// Equipamiento (ojo: pestaña FULL con chip “Full” especial)
const EQUIP_BASICO = [
  "Aire Acondicionado",
  "Alza Vidrios",
  "Cierre Centralizado",
  "ABS",
  "Airbags"
];
const EQUIP_MEDIO = [
  "4x4",
  "Radio Con Pantalla",
  "Llantas",
  "Diesel",
  "Automatico"
];
const EQUIP_FULL = [
  "Control Crucero",
  "Climatizador",
  "Sunroof",
  "Modo Sport",
  "AppleCar/AndroidAuto",
  "Asientos de Cuero",
  "Full" // ← especial
];

// Utilidades
const onlyDigits = (s) => (s || "").toString().replace(/[^\d]/g, "");
const clMiles = (n) => Number(n || 0).toLocaleString("es-CL").replace(/\./g, ".");
const fmtPrecio = (v) => "$" + clMiles(onlyDigits(v) || "0");
const fmtKm = (v) => clMiles(onlyDigits(v) || "0") + " km";
const ensureCc = (s) => {
  const t = (s || "").trim();
  return /cc\b/i.test(t) ? t : (t ? `${t} cc` : "");
};

// E1a estándar, pero luego aplicaremos la regla de “Full solo al final”
const buildE1LinesBase = (kmTxt, items) => {
  const L = [];
  if (kmTxt && items.length) { L.push(`${kmTxt} , ${items[0]}`); items = items.slice(1); }
  else if (kmTxt) { L.push(kmTxt); }
  for (let i = 0; i < items.length; i += 2) {
    if (i + 1 < items.length) L.push(`${items[i]} , ${items[i + 1]}`);
    else L.push(items[i]);
  }
  return L;
};

// Click robusto
function bindSmartClick(el, handler){
  const wrap = (ev) => { ev.preventDefault(); ev.stopPropagation(); handler(ev); };
  el.addEventListener("pointerup", wrap, {passive:false});
  el.addEventListener("click",     wrap, {passive:false});
  el.addEventListener("touchend",  wrap, {passive:false});
  el.addEventListener("mouseup",   wrap, {passive:false});
}

(function main(){
  // Campos
  const modeloEl = document.getElementById("modelo");
  const anioEl = document.getElementById("anio");
  const cilindradaEl = document.getElementById("cilindrada");
  const versionEl = document.getElementById("version");
  const precioEl = document.getElementById("precio");
  const kmEl = document.getElementById("km");

  // Tabs y paneles
  const tabs = document.getElementById("catTabs");
  const panelBasico = document.getElementById("panelBasico");
  const panelMedio  = document.getElementById("panelMedio");
  const panelFull   = document.getElementById("panelFull");

  const chipsBasico = document.getElementById("chipsBasico");
  const chipsMedio  = document.getElementById("chipsMedio");
  const chipsFull   = document.getElementById("chipsFull");

  // Selección actual SOLO de la categoría visible
  let selected = new Set();
  let currentCat = "BASICO";

  const btnGenerar = document.getElementById("btnGenerar");
  const btnDescargar = document.getElementById("btnDescargar");
  const btnLimpiar = document.getElementById("btnLimpiar");
  const status = document.getElementById("status");

  const canvas = document.getElementById("lienzo");
  const ctx = canvas.getContext("2d");

  // Render de chips para la categoría activa
  function renderChips(container, list){
    container.innerHTML = "";
    selected.clear(); // acordeón: al cambiar de panel, se reinicia la selección
    list.forEach(label => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = label;
      bindSmartClick(chip, () => {
        // Regla especial: si estamos en FULL y el usuario toca el chip “Full”
        if (currentCat === "FULL" && label.toLowerCase() === "full"){
          // “Full” queda solo: limpiar todo y marcar solo Full
          selected.clear();
          // quita visual a todos
          container.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
          // marca Full
          selected.add("Full");
          chip.classList.add("active");
          return;
        }

        // Si ya está, lo saco; si no, lo agrego
        if (selected.has(label)) { selected.delete(label); chip.classList.remove("active"); }
        else { selected.add(label); chip.classList.add("active"); }
      });
      container.appendChild(chip);
    });
  }

  // Pintar primera categoría
  renderChips(chipsBasico, EQUIP_BASICO);

  // Cambiar panel visible
  function showPanel(cat){
    currentCat = cat;
    // tabs visual
    tabs.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
    tabs.querySelector(`.seg-btn[data-cat="${cat}"]`).classList.add("active");
    // paneles
    [panelBasico, panelMedio, panelFull].forEach(p => p.classList.remove("show"));
    if (cat === "BASICO"){ panelBasico.classList.add("show"); renderChips(chipsBasico, EQUIP_BASICO); }
    if (cat === "MEDIO"){ panelMedio.classList.add("show"); renderChips(chipsMedio, EQUIP_MEDIO); }
    if (cat === "FULL"){ panelFull.classList.add("show"); renderChips(chipsFull, EQUIP_FULL); }
  }

  // Eventos de tabs
  tabs.querySelectorAll(".seg-btn").forEach(btn => {
    bindSmartClick(btn, () => showPanel(btn.dataset.cat));
  });

  // Cargar plantilla
  const plantilla = new Image();
  plantilla.crossOrigin = "anonymous";
  plantilla.src = TEMPLATE_SRC;
  plantilla.onload = () => {
    canvas.width = plantilla.naturalWidth;
    canvas.height = plantilla.naturalHeight;
    ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);
    status.textContent = `✅ Plantilla cargada · ${VERSION}`;
  };
  plantilla.onerror = () => {
    status.style.color = "#e67c7c";
    status.textContent = "⚠️ No se pudo cargar /plantilla/plantilla_franval.png";
    btnGenerar.disabled = true; btnDescargar.disabled = true;
  };

  // Ajuste de fuente
  function fitFont(ctx, text, maxWidth, maxHeight, targetPx, minPx = 10) {
    const safeText = text && text.length ? text : " ";
    let size = Math.max(targetPx, minPx);
    ctx.font = `600 ${size}px Inter, Arial, sans-serif`;
    let width = ctx.measureText(safeText).width;
    let m = ctx.measureText(safeText);
    let height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;

    while ((width > maxWidth || (maxHeight && height > maxHeight)) && size > minPx) {
      size -= 2;
      ctx.font = `600 ${size}px Inter, Arial, sans-serif`;
      width = ctx.measureText(safeText).width;
      m = ctx.measureText(safeText);
      height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    }
    return { size, width, height, text: safeText };
  }

  function generar(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);

    const W = canvas.width, H = canvas.height;
    const bannerTop = GEO.BANNER_TOP * H;
    const bannerHeight = GEO.BANNER_HEIGHT * H;
    const maxwModel = GEO.MAXW_MODEL * (GEO.BANNER_RIGHT - GEO.BANNER_LEFT) * W;

    const modelo = (modeloEl.value || "").trim();
    const subtitle = `${(anioEl.value || "").trim()} ${ensureCc(cilindradaEl.value)} ${(versionEl.value || "").trim()}`.trim();
    const precioTxt = fmtPrecio(precioEl.value);
    const kmTxt = fmtKm(kmEl.value);

    // Items elegidos en la categoría visible
    let items = Array.from(selected);

    // Regla “Full”: si el set contiene “Full” (en FULL), forzamos “solo y al final”
    const hasFull = items.some(s => s.toLowerCase() === "full");
    if (currentCat === "FULL" && hasFull){
      // ignora cualquier otro seleccionado
      items = ["Full"];
      // E1a especial: km va SOLO en su línea y luego “Full” en la última
      const lines = [];
      if (kmTxt) lines.push(kmTxt);
      lines.push("Full");

      // Render directo y salimos
      // Modelo
      ctx.fillStyle = "#fff";
      let r = fitFont(ctx, modelo, maxwModel, bannerHeight-6, GEO.TARGET_MODEL*H);
      ctx.font = `800 ${r.size}px Inter, Arial, sans-serif`;
      const yModel = bannerTop + (bannerHeight-r.size)/2 + r.size*0.85 + GEO.MODEL_OFFSET*H;
      ctx.fillText(r.text, (W-ctx.measureText(r.text).width)/2, yModel);

      // Subtítulo
      ctx.fillStyle = "#000";
      r = fitFont(ctx, subtitle, GEO.MAXW_SUB*W, null, GEO.TARGET_SUB*H);
      ctx.font = `700 ${r.size}px Inter, Arial, sans-serif`;
      ctx.fillText(r.text, (W-ctx.measureText(r.text).width)/2, GEO.Y_SUB*H);

      // Precio
      r = fitFont(ctx, precioTxt, GEO.MAXW_PRICE*W, null, GEO.TARGET_PRICE*H);
      ctx.font = `800 ${r.size}px Inter, Arial, sans-serif`;
      ctx.fillText(precioTxt, (W-ctx.measureText(precioTxt).width)/2, GEO.Y_PRICE*H);

      // Detalle: km (si hay) y luego Full
      let y = GEO.Y_DETAIL*H;
      for (const line of lines){
        r = fitFont(ctx, line, GEO.MAXW_DET*W, null, GEO.TARGET_DET*H);
        ctx.font = `400 ${r.size}px Inter, Arial, sans-serif`;
        ctx.fillText(r.text, (W-ctx.measureText(r.text).width)/2, y);
        y += r.size * 1.30;
      }

      btnDescargar.disabled = false;
      status.style.color = "#8bd48b";
      status.textContent = `✅ Previsualización lista (FULL solo) · ${VERSION}`;
      return;
    }

    // E1a normal para Básico o Medio
    const detailLines = buildE1LinesBase(kmTxt, items);

    // Modelo
    ctx.fillStyle = "#fff";
    let r = fitFont(ctx, modelo, maxwModel, bannerHeight-6, GEO.TARGET_MODEL*H);
    ctx.font = `800 ${r.size}px Inter, Arial, sans-serif`;
    const yModel = bannerTop + (bannerHeight-r.size)/2 + r.size*0.85 + GEO.MODEL_OFFSET*H;
    ctx.fillText(r.text, (W-ctx.measureText(r.text).width)/2, yModel);

    // Subtítulo
    ctx.fillStyle = "#000";
    r = fitFont(ctx, subtitle, GEO.MAXW_SUB*W, null, GEO.TARGET_SUB*H);
    ctx.font = `700 ${r.size}px Inter, Arial, sans-serif`;
    ctx.fillText(r.text, (W-ctx.measureText(r.text).width)/2, GEO.Y_SUB*H);

    // Precio
    r = fitFont(ctx, precioTxt, GEO.MAXW_PRICE*W, null, GEO.TARGET_PRICE*H);
    ctx.font = `800 ${r.size}px Inter, Arial, sans-serif`;
    ctx.fillText(precioTxt, (W-ctx.measureText(precioTxt).width)/2, GEO.Y_PRICE*H);

    // Detalle E1a
    let y = GEO.Y_DETAIL*H;
    for (const line of detailLines){
      r = fitFont(ctx, line, GEO.MAXW_DET*W, null, GEO.TARGET_DET*H);
      ctx.font = `400 ${r.size}px Inter, Arial, sans-serif`;
      ctx.fillText(r.text, (W-ctx.measureText(r.text).width)/2, y);
      y += r.size * 1.30;
    }

    btnDescargar.disabled = false;
    status.style.color = "#8bd48b";
    status.textContent = `✅ Previsualización lista (${currentCat}) · ${VERSION}`;
  }

  function descargar(){
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "publicacion_franval.png";
    document.body.appendChild(a);
    a.click(); a.remove();
  }

  function limpiar(){
    ["modelo","anio","cilindrada","version","precio","km"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    selected.clear();
    showPanel("BASICO");
    btnDescargar.disabled = true;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(plantilla,0,0,canvas.width,canvas.height);
    status.style.color = "";
    status.textContent = `Plantilla cargada. Completa y genera. · ${VERSION}`;
  }

  // Hooks
  bindSmartClick(btnGenerar, generar);
  bindSmartClick(btnDescargar, descargar);
  bindSmartClick(btnLimpiar, limpiar);

  // Iniciar en BÁSICO
  function showPanel(cat){ /* definida arriba */ }
  // Re-define showPanel aquí para que exista:
  window.showPanel = (cat) => {
    currentCat = cat;
    tabs.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
    tabs.querySelector(`.seg-btn[data-cat="${cat}"]`).classList.add("active");
    [panelBasico, panelMedio, panelFull].forEach(p => p.classList.remove("show"));
    if (cat === "BASICO"){ panelBasico.classList.add("show"); renderChips(chipsBasico, EQUIP_BASICO); }
    if (cat === "MEDIO"){ panelMedio.classList.add("show"); renderChips(chipsMedio, EQUIP_MEDIO); }
    if (cat === "FULL"){ panelFull.classList.add("show"); renderChips(chipsFull, EQUIP_FULL); }
  };
  // Render init
  showPanel("BASICO");
})();
