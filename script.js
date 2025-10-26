// ========== FRANVAL · FULL combinable + Equipamiento Extra + KM opcional ==========
const VERSION = "2025-10-21-final";
const TEMPLATE_SRC = "plantilla/plantilla_franval.png";

// Geometría
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

  Y_SUB:    0.280,
  Y_PRICE:  0.430,
  Y_DETAIL: 0.490,

  MODEL_OFFSET: -0.065
};

// Equipamiento
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
  "Full"
];

// Utils
const onlyDigits = (s) => (s || "").toString().replace(/[^\d]/g, "");
const clMiles = (n) => Number(n || 0).toLocaleString("es-CL").replace(/\./g, ".");
const fmtPrecio = (v) => "$" + clMiles(onlyDigits(v) || "0");
const ensureCc = (s) => {
  const t = (s || "").trim();
  return /cc\b/i.test(t) ? t : (t ? `${t} cc` : "");
};

// Capitalizar cada palabra del extra
function capitalizeExtra(str){
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// E1a base
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

// FULL al final
function placeFullAtEnd(lines){
  const cleaned = [];
  let hasFull = false;
  for (const ln of lines){
    if (/^full$/i.test(ln.trim())){ hasFull = true; continue; }
    const parts = ln.split(",").map(s => s.trim()).filter(Boolean);
    const remaining = parts.filter(p => p.toLowerCase() !== "full");
    if (remaining.length !== parts.length) hasFull = true;
    if (remaining.length === 0) continue;
    cleaned.push(remaining.join(" , "));
  }
  if (hasFull) cleaned.push("Full");
  return cleaned;
}

// Fit font
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

// Smart click (PC + iPhone)
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

// MAIN
(function main(){
  // Inputs
  const modeloEl = document.getElementById("modelo");
  const anioEl = document.getElementById("anio");
  const cilindradaEl = document.getElementById("cilindrada");
  const versionEl = document.getElementById("version");
  const precioEl = document.getElementById("precio");
  const kmEl = document.getElementById("km");
  const equipExtraEl = document.getElementById("equipExtra");

  // Tabs & chips
  const tabs = document.getElementById("catTabs");
  const panelBasico = document.getElementById("panelBasico");
  const panelMedio  = document.getElementById("panelMedio");
  const panelFull   = document.getElementById("panelFull");

  const chipsBasico = document.getElementById("chipsBasico");
  const chipsMedio  = document.getElementById("chipsMedio");
  const chipsFull   = document.getElementById("chipsFull");

  const selected = new Set();

  function renderChips(container, list){
    container.innerHTML = "";
    list.forEach(label => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = label;
      if (selected.has(label)) chip.classList.add("active");

      bindSmartClick(chip, () => {
        if (selected.has(label)) { selected.delete(label); chip.classList.remove("active"); }
        else { selected.add(label); chip.classList.add("active"); }
      });

      container.appendChild(chip);
    });
  }

  function refreshAllChips(){
    renderChips(chipsBasico, EQUIP_BASICO);
    renderChips(chipsMedio, EQUIP_MEDIO);
    renderChips(chipsFull, EQUIP_FULL);
  }

  function showPanel(cat){
    tabs.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
    tabs.querySelector(`.seg-btn[data-cat="${cat}"]`).classList.add("active");
    [panelBasico, panelMedio, panelFull].forEach(p => p.classList.remove("show"));
    if (cat === "BÁSICO" || cat === "BASICO") panelBasico.classList.add("show");
    if (cat === "MEDIO") panelMedio.classList.add("show");
    if (cat === "FULL")  panelFull.classList.add("show");
  }

  tabs.querySelectorAll(".seg-btn").forEach(btn => {
    bindSmartClick(btn, () => showPanel(btn.dataset.cat));
  });

  refreshAllChips();
  showPanel("BASICO");

  // Canvas
  const canvas = document.getElementById("lienzo");
  const ctx = canvas.getContext("2d");

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

  // Generar
  function generar(){
    let items = Array.from(selected);

    // Extra manual con capitalización
    const extraRaw = (equipExtraEl.value || "").trim();
    if (extraRaw){
      const extras = extraRaw.split(",").map(s => capitalizeExtra(s.trim())).filter(Boolean);
      items = items.concat(extras);
    }

    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);

    const W = canvas.width, H = canvas.height;
    const bannerTop = GEO.BANNER_TOP * H;
    const bannerHeight = GEO.BANNER_HEIGHT * H;
    const maxwModel = GEO.MAXW_MODEL * (GEO.BANNER_RIGHT - GEO.BANNER_LEFT) * W;

    const modelo = (modeloEl.value || "").trim();
    const subtitle = `${(anioEl.value || "").trim()} ${ensureCc(cilindradaEl.value)} ${(versionEl.value || "").trim()}`.trim();
    const precioTxt = fmtPrecio(precioEl.value);

    // KM opcional
    const kmRaw = onlyDigits(kmEl.value);
    const kmTxt = kmRaw ? (clMiles(kmRaw) + " km") : "";

    // Líneas
    let detailLines = buildE1LinesBase(kmTxt, items);

    // FULL al final
    const hasFull = items.some(s => s.toLowerCase() === "full");
    if (hasFull){
      detailLines = placeFullAtEnd(detailLines);
    }

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

    // Detalle
    let y = GEO.Y_DETAIL*H;
    for (const line of detailLines){
      r = fitFont(ctx, line, GEO.MAXW_DET*W, null, GEO.TARGET_DET*H);
      ctx.font = `400 ${r.size}px Inter, Arial, sans-serif`;
      ctx.fillText(r.text, (W-ctx.measureText(r.text).width)/2, y);
      y += r.size * 1.30;
    }

    const status = document.getElementById("status");
    document.getElementById("btnDescargar").disabled = false;
    if (status){ status.style.color = "#8bd48b"; status.textContent = `✅ Previsualización lista · ${VERSION}`; }
  }

  // Descargar con nombre automático
  function descargar(){
    const modeloRaw  = (modeloEl.value || "").trim().replace(/\s+/g, "_");
    const anioRaw    = (anioEl.value || "").trim().replace(/\s+/g, "_");
    const nombreModelo = modeloRaw || "Vehiculo";
    const nombreAnio   = anioRaw   || "";
    const fileName = `${nombreModelo}_${nombreAnio}.png`;

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Limpiar
  function limpiar(){
    ["modelo","anio","cilindrada","version","precio","km","equipExtra"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    selected.clear();
    refreshAllChips();
    showPanel("BASICO");

    const status = document.getElementById("status");
    document.getElementById("btnDescargar").disabled = true;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(plantilla,0,0,canvas.width,canvas.height);
    if (status){ status.style.color = ""; status.textContent = `Plantilla cargada. Completa y genera. · ${VERSION}`; }
  }

  // Eventos
  bindSmartClick(document.getElementById("btnGenerar"), generar);
  bindSmartClick(document.getElementById("btnDescargar"), descargar);
  bindSmartClick(document.getElementById("btnLimpiar"), limpiar);
})();
