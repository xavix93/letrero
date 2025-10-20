// ========== Franval Generator v3 (PC + iPhone OK) ==========

const VERSION = "v3-2025-10-20";
const TEMPLATE_SRC = "plantilla/plantilla_franval.png";

const GEO = {
  BANNER_LEFT:   0.12,
  BANNER_RIGHT:  0.88,
  BANNER_TOP:    0.24,
  BANNER_HEIGHT: 0.06,

  MAXW_MODEL: 1.20 * (0.88 - 0.12), // punto decimal
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

// === Equipamiento por CATEGORÍA (FULL renombrado) ===
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

// ===== Utils =====
const onlyDigits = (s) => (s || "").toString().replace(/[^\d]/g, "");
const clMiles = (n) => Number(n || 0).toLocaleString("es-CL").replace(/\./g, ".");
const fmtPrecio = (v) => "$" + clMiles(onlyDigits(v) || "0");
const fmtKm = (v) => clMiles(onlyDigits(v) || "0") + " km";
const ensureCc = (s) => {
  const t = (s || "").trim();
  return /cc\b/i.test(t) ? t : (t ? `${t} cc` : "");
};
const buildE1Lines = (kmTxt, items) => {
  const L = [];
  if (kmTxt && items.length) { L.push(`${kmTxt} , ${items[0]}`); items = items.slice(1); }
  else if (kmTxt) { L.push(kmTxt); }
  for (let i = 0; i < items.length; i += 2) {
    if (i + 1 < items.length) L.push(`${items[i]} , ${items[i + 1]}`);
    else L.push(items[i]);
  }
  return L;
};
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

// ===== Click robusto (PC + iPhone + Android) =====
function bindSmartClick(el, handler){
  let locked = false;
  const wrap = (ev) => {
    ev.preventDefault(); ev.stopPropagation();
    if (locked) return;
    locked = true;
    try { handler(ev); } finally {
      setTimeout(() => locked = false, 50); // evita doble disparo
    }
  };
  el.addEventListener("pointerup", wrap, {passive:false});
  el.addEventListener("click",     wrap, {passive:false});
  el.addEventListener("touchend",  wrap, {passive:false});
  el.addEventListener("mouseup",   wrap, {passive:false});
}

(function main(){
  // Verifica que el HTML que cargó realmente diga FULL (por si caché)
  document.querySelectorAll(".equip-title").forEach(t => {
    if (t.textContent.trim().toLowerCase() === "total") t.textContent = "FULL";
  });

  const modeloEl = document.getElementById("modelo");
  const anioEl = document.getElementById("anio");
  const cilindradaEl = document.getElementById("cilindrada");
  const versionEl = document.getElementById("version");
  const precioEl = document.getElementById("precio");
  const kmEl = document.getElementById("km");

  const chipsBasico = document.getElementById("chipsBasico");
  const chipsMedio  = document.getElementById("chipsMedio");
  const chipsFull   = document.getElementById("chipsFull");

  const btnGenerar = document.getElementById("btnGenerar");
  const btnDescargar = document.getElementById("btnDescargar");
  const btnLimpiar = document.getElementById("btnLimpiar");
  const status = document.getElementById("status");

  // Sello de versión (para que veas que cargó este JS)
  if (status) status.textContent = `🔧 Cargado ${VERSION} · Plantilla…`;

  const canvas = document.getElementById("lienzo");
  const ctx = canvas.getContext("2d");

  // Selección global
  const selected = new Set();

  // Render chips de una lista en un contenedor
  function renderChips(container, list){
    container.innerHTML = "";
    list.forEach(label => {
      const chip = document.createElement("button");
      chip.type = "button"; // evita submit si hay form
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

  // Pinta las 3 secciones (simultáneas)
  renderChips(chipsBasico, EQUIP_BASICO);
  renderChips(chipsMedio,  EQUIP_MEDIO);
  renderChips(chipsFull,   EQUIP_FULL);

  // Cargar plantilla
  const plantilla = new Image();
  plantilla.crossOrigin = "anonymous";
  plantilla.src = TEMPLATE_SRC;
  plantilla.onload = () => {
    canvas.width = plantilla.naturalWidth;
    canvas.height = plantilla.naturalHeight;
    ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);
    if (status) status.textContent = `✅ Plantilla cargada · ${VERSION}`;
  };
  plantilla.onerror = () => {
    if (status){
      status.style.color = "#e67c7c";
      status.textContent = "⚠️ No se pudo cargar /plantilla/plantilla_franval.png";
    }
    btnGenerar.disabled = true; btnDescargar.disabled = true;
  };

  function generar(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);

    const W = canvas.width, H = canvas.height;
    const bannerTop = GEO.BANNER_TOP * H;
    const bannerHeight = GEO.BANNER_HEIGHT * H;
    const maxwModel = GEO.MAXW_MODEL * (GEO.BANNER_RIGHT - GEO.BANNER_LEFT) * W;

    const modelo = (modeloEl?.value || "").trim();
    const subtitle = `${(anioEl?.value || "").trim()} ${ensureCc(cilindradaEl?.value)} ${(versionEl?.value || "").trim()}`.trim();
    const precioTxt = fmtPrecio(precioEl?.value);
    const kmTxt = fmtKm(kmEl?.value);

    const items = Array.from(selected);
    const detailLines = buildE1Lines(kmTxt, items);

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

    // Detalle (E1a)
    let y = GEO.Y_DETAIL*H;
    for (const line of detailLines){
      r = fitFont(ctx, line, GEO.MAXW_DET*W, null, GEO.TARGET_DET*H);
      ctx.font = `400 ${r.size}px Inter, Arial, sans-serif`;
      ctx.fillText(r.text, (W-ctx.measureText(r.text).width)/2, y);
      y += r.size * 1.30;
    }

    btnDescargar.disabled = false;
    if (status){
      status.style.color = "#8bd48b";
      status.textContent = `✅ Previsualización lista · seleccionados: ${items.length} · ${VERSION}`;
    }
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
    renderChips(chipsBasico, EQUIP_BASICO);
    renderChips(chipsMedio,  EQUIP_MEDIO);
    renderChips(chipsFull,   EQUIP_FULL);

    btnDescargar.disabled = true;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(plantilla,0,0,canvas.width,canvas.height);
    if (status){
      status.style.color = "";
      status.textContent = `Plantilla cargada. Completa y genera. · ${VERSION}`;
    }
  }

  bindSmartClick(btnGenerar, generar);
  bindSmartClick(btnDescargar, descargar);
  bindSmartClick(btnLimpiar, limpiar);
})();
