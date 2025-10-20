// === Plantilla fija (en tu repo) ===
const TEMPLATE_SRC = "plantilla/plantilla_franval.png";

// === Geometría (clon N400, editable) ===
const GEO = {
  BANNER_LEFT:   0.12,
  BANNER_RIGHT:  0.88,
  BANNER_TOP:    0.24,
  BANNER_HEIGHT: 0.06,

  // ⚠️ IMPORTANTE: punto decimal, no coma
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

// === Equipamiento por CATEGORÍA ===
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

const EQUIP_TOTAL = [
  "Control Crucero",
  "Climatizador",
  "Sunroof",
  "Modo Sport",
  "AppleCar/AndroidAuto",
  "Asientos de Cuero",
  "Full"
];

// === Utilidades de formato ===
const onlyDigits = (s) => (s || "").toString().replace(/[^\d]/g, "");
const clMiles = (n) => Number(n).toLocaleString("es-CL").replace(/\./g, ".");
const fmtPrecio = (v) => "$" + clMiles(onlyDigits(v) || "0");
const fmtKm = (v) => clMiles(onlyDigits(v) || "0") + " km";
const ensureCc = (s) => {
  const t = (s || "").trim();
  return /cc\b/i.test(t) ? t : (t ? `${t} cc` : "");
};

// === E1a: km en la 1ª línea con el primer ítem ===
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

// === Ajuste de tipografía adaptable ===
function fitFont(ctx, text, maxWidth, maxHeight, targetPx, minPx = 10) {
  const safeText = text && text.length ? text : " ";
  let size = Math.max(targetPx, minPx);
  ctx.font = `600 ${size}px Inter, Arial, sans-serif`;
  let width = ctx.measureText(safeText).width;
  let metrics = ctx.measureText(safeText);
  let height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  while ((width > maxWidth || (maxHeight && height > maxHeight)) && size > minPx) {
    size -= 2;
    ctx.font = `600 ${size}px Inter, Arial, sans-serif`;
    width = ctx.measureText(safeText).width;
    metrics = ctx.measureText(safeText);
    height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  }
  return { size, width, height, text: safeText };
}

(async function main(){
  // Inputs
  const modeloEl = document.getElementById("modelo");
  const anioEl = document.getElementById("anio");
  const cilindradaEl = document.getElementById("cilindrada");
  const versionEl = document.getElementById("version");
  const precioEl = document.getElementById("precio");
  const kmEl = document.getElementById("km");

  // Categorías
  const tabs = document.getElementById("catTabs");
  const chipsEl = document.getElementById("chips");
  let currentCat = "BASICO";     // por defecto
  let currentItems = EQUIP_BASICO;

  // Selección de chips de la categoría actual
  let selected = new Set();

  // Botones
  const btnGenerar = document.getElementById("btnGenerar");
  const btnDescargar = document.getElementById("btnDescargar");
  const btnLimpiar = document.getElementById("btnLimpiar");
  const status = document.getElementById("status");

  // Canvas
  const canvas = document.getElementById("lienzo");
  const ctx = canvas.getContext("2d");

  // Cargar plantilla
  const plantilla = new Image();
  plantilla.crossOrigin = "anonymous";
  plantilla.src = TEMPLATE_SRC;
  const loaded = await new Promise((resolve) => {
    plantilla.onload = () => resolve(true);
    plantilla.onerror = () => resolve(false);
  });

  if (!loaded) {
    status.style.color = "#e67c7c";
    status.textContent = "⚠️ No se pudo cargar /plantilla/plantilla_franval.png";
    btnGenerar.disabled = true; btnDescargar.disabled = true;
    return;
  }

  // Canvas nativo
  canvas.width = plantilla.naturalWidth;
  canvas.height = plantilla.naturalHeight;
  ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);
  status.textContent = "✅ Plantilla cargada";

  // Render de chips según categoría
  function renderChips(list){
    chipsEl.innerHTML = "";
    selected.clear(); // en Opción A reiniciamos al cambiar categoría
    list.forEach(label => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = label;
      chip.addEventListener("click", () => {
        if (selected.has(label)) { selected.delete(label); chip.classList.remove("active"); }
        else { selected.add(label); chip.classList.add("active"); }
      });
      chipsEl.appendChild(chip);
    });
  }
  renderChips(currentItems);

  // Cambio de categoría (tabs)
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn"); if (!btn) return;
    tabs.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCat = btn.dataset.cat;
    currentItems = currentCat === "BASICO" ? EQUIP_BASICO : currentCat === "MEDIO" ? EQUIP_MEDIO : EQUIP_TOTAL;
    renderChips(currentItems);
  });

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

    // Items seleccionados de la categoría actual
    const items = Array.from(selected);
    const detailLines = buildE1Lines(kmTxt, items);

    // Modelo (blanco)
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
    status.textContent = `✅ Previsualización lista (${currentCat.toLowerCase()})`;
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
    ["modelo","anio","cilindrada","version","precio","km"].forEach(id => document.getElementById(id).value = "");
    // reset categoría a BASICO
    tabs.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
    tabs.querySelector('.seg-btn[data-cat="BASICO"]').classList.add("active");
    currentCat = "BASICO"; currentItems = EQUIP_BASICO; renderChips(currentItems);
    btnDescargar.disabled = true;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(plantilla,0,0,canvas.width,canvas.height);
    status.textContent = "Plantilla cargada. Completa y genera.";
    status.style.color = "";
  }

  btnGenerar.addEventListener("click", generar);
  btnDescargar.addEventListener("click", descargar);
  btnLimpiar.addEventListener("click", limpiar);
})();
