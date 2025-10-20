// ========== FRANVAL · Tabs + selección persistente + FULL especial (F1) ==========
const VERSION = "2025-10-20-f1-final";
const TEMPLATE_SRC = "plantilla/plantilla_franval.png";

// Geometría (mantiene tu layout)
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

// Equipamiento (FULL con chip “Full” especial)
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
  "Full" // especial
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

// E1a base (luego aplicamos la regla FULL si corresponde)
function buildE1LinesBase(kmTxt, items){
  const L = [];
  if (kmTxt && items.length) { L.push(`${kmTxt} , ${items[0]}`); items = items.slice(1); }
  else if (kmTxt) { L.push(kmTxt); }
  for (let i = 0; i < items.length; i += 2){
    if (i + 1 < items.length) L.push(`${items[i]} , ${items[i + 1]}`);
    else L.push(items[i]);
  }
  return L;
}

// Ajuste de tipografía
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

// Click robusto (PC + iPhone)
function bindSmartClick(el, handler){
  let lock = false;
  const wrap = (ev) => {
    ev.preventDefault(); ev.stopPropagation();
    if (lock) return;
    lock = true;
    try { handler(ev); } finally { setTimeout(() => (lock = false), 50); }
  };
  el.addEventListener("pointerup", wrap, {passive:false});
  el.addEventListener("click",     wrap, {passive:false});
  el.addEventListener("touchend",  wrap, {passive:false});
  el.addEventListener("mouseup",   wrap, {passive:false});
}

(function main(){
  // Inputs
  const modeloEl = document.getElementById("modelo");
  const anioEl = document.getElementById("anio");
  const cilindradaEl = document.getElementById("cilindrada");
  const versionEl = document.getElementById("version");
  const precioEl = document.getElementById("precio");
  const kmEl = document.getElementById("km");

  // Tabs & Panels
  const tabs = document.getElementById("catTabs");
  const panelBasico = document.getElementById("panelBasico");
  const panelMedio  = document.getElementById("panelMedio");
  const panelFull   = document.getElementById("panelFull");

  const chipsBasico = document.getElementById("chipsBasico");
  const chipsMedio  = document.getElementById("chipsMedio");
  const chipsFull   = document.getElementById("chipsFull");

  // Selección GLOBAL (se mantiene entre pestañas) — Opción A
  const selected = new Set();

  // Estado de pestaña actual
  let currentCat = "BASICO";

  // Render chips de una categoría (respetando lo ya seleccionado)
  function renderChips(container, list, isFullPanel=false){
    container.innerHTML = "";
    list.forEach(label => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = label;
      if (selected.has(label)) chip.classList.add("active");

      bindSmartClick(chip, () => {
        // Regla especial: si estamos en FULL y tocan “Full”
        if (isFullPanel && label.toLowerCase() === "full"){
          selected.clear();                  // quitar TODO
          selected.add("Full");              // dejar solo Full
          // refrescar visual de los 3 paneles según selección actual
          refreshAllChips();
          return;
        }
        // Si “Full” estaba seleccionado y ahora se elige otra cosa → quitar Full
        if (selected.has("Full") && !(isFullPanel && label.toLowerCase() === "full")){
          selected.delete("Full");
        }

        if (selected.has(label)) { selected.delete(label); chip.classList.remove("active"); }
        else { selected.add(label); chip.classList.add("active"); }
      });

      container.appendChild(chip);
    });
  }

  function refreshAllChips(){
    renderChips(chipsBasico, EQUIP_BASICO, false);
    renderChips(chipsMedio,  EQUIP_MEDIO,  false);
    renderChips(chipsFull,   EQUIP_FULL,   true);
  }

  // Mostrar panel (solo uno a la vez)
  function showPanel(cat){
    currentCat = cat;
    tabs.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
    const btn = tabs.querySelector(`.seg-btn[data-cat="${cat}"]`);
    if (btn) btn.classList.add("active");

    [panelBasico, panelMedio, panelFull].forEach(p => p.classList.remove("show"));
    if (cat === "BASICO") { panelBasico.classList.add("show"); }
    if (cat === "MEDIO")  { panelMedio.classList.add("show"); }
    if (cat === "FULL")   { panelFull.classList.add("show"); }
  }

  // Eventos de tabs
  tabs.querySelectorAll(".seg-btn").forEach(btn => {
    bindSmartClick(btn, () => showPanel(btn.dataset.cat));
  });

  // Pintar chips al iniciar
  refreshAllChips();
  showPanel("BASICO");

  // Canvas
  const canvas = document.getElementById("lienzo");
  const ctx = canvas.getContext("2d");

  // Cargar plantilla
  const plantilla = new Image();
  plantilla.crossOrigin = "anonymous";
  plantilla.src = TEMPLATE_SRC;
  plantilla.onload = () => {
    canvas.width = plantilla.naturalWidth;
    canvas.height = plantilla.naturalHeight;
    ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);
    const status = document.getElementById("status");
    if (status) status.textContent = `✅ Plantilla cargada · ${VERSION}`;
  };
  plantilla.onerror = () => {
    const status = document.getElementById("status");
    if (status){
      status.style.color = "#e67c7c";
      status.textContent = "⚠️ No se pudo cargar /plantilla/plantilla_franval.png";
    }
    document.getElementById("btnGenerar").disabled = true;
    document.getElementById("btnDescargar").disabled = true;
  };

  // Generar imagen
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

    const items = Array.from(selected);
    const hasFull = items.some(s => s.toLowerCase() === "full");

    // Render cabeceras
    ctx.fillStyle = "#fff";
    let r = fitFont(ctx, modelo, maxwModel, bannerHeight-6, GEO.TARGET_MODEL*H);
    ctx.font = `800 ${r.size}px Inter, Arial, sans-serif`;
    const yModel = bannerTop + (bannerHeight-r.size)/2 + r.size*0.85 + GEO.MODEL_OFFSET*H;
    ctx.fillText(r.text, (W-ctx.measureText(r.text).width)/2, yModel);

    ctx.fillStyle = "#000";
    r = fitFont(ctx, subtitle, GEO.MAXW_SUB*W, null, GEO.TARGET_SUB*H);
    ctx.font = `700 ${r.size}px Inter, Arial, sans-serif`;
    ctx.fillText(r.text, (W-ctx.measureText(r.text).width)/2, GEO.Y_SUB*H);

    r = fitFont(ctx, precioTxt, GEO.MAXW_PRICE*W, null, GEO.TARGET_PRICE*H);
    ctx.font = `800 ${r.size}px Inter, Arial, sans-serif`;
    ctx.fillText(precioTxt, (W-ctx.measureText(precioTxt).width)/2, GEO.Y_PRICE*H);

    // Detalle: FULL especial o E1a normal
    let y = GEO.Y_DETAIL*H;
    if (hasFull){
      // km solo (si existe) y luego “Full” solo al final
      const lines = [];
      if (kmTxt) lines.push(kmTxt);
      lines.push("Full");
      for (const line of lines){
        r = fitFont(ctx, line, GEO.MAXW_DET*W, null, GEO.TARGET_DET*H);
        ctx.font = `400 ${r.size}px Inter, Arial, sans-serif`;
        ctx.fillText(r.text, (W-ctx.measureText(r.text).width)/2, y);
        y += r.size * 1.30;
      }
    } else {
      const detailLines = buildE1LinesBase(kmTxt, items);
      for (const line of detailLines){
        r = fitFont(ctx, line, GEO.MAXW_DET*W, null, GEO.TARGET_DET*H);
        ctx.font = `400 ${r.size}px Inter, Arial, sans-serif`;
        ctx.fillText(r.text, (W-ctx.measureText(r.text).width)/2, y);
        y += r.size * 1.30;
      }
    }

    const status = document.getElementById("status");
    document.getElementById("btnDescargar").disabled = false;
    if (status){ status.style.color = "#8bd48b"; status.textContent = `✅ Previsualización lista · ${VERSION}`; }
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
    selected.clear();      // limpiar selección global
    refreshAllChips();     // refrescar visual
    showPanel("BASICO");   // volver a básico

    const status = document.getElementById("status");
    document.getElementById("btnDescargar").disabled = true;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(plantilla,0,0,canvas.width,canvas.height);
    if (status){ status.style.color = ""; status.textContent = `Plantilla cargada. Completa y genera. · ${VERSION}`; }
  }

  bindSmartClick(document.getElementById("btnGenerar"), generar);
  bindSmartClick(document.getElementById("btnDescargar"), descargar);
  bindSmartClick(document.getElementById("btnLimpiar"), limpiar);
})();
