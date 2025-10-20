// --- Configuración principal ---
const TEMPLATE_SRC = "plantilla/plantilla_franval.png"; // tu imagen base con franja gris

// Proporciones (clon del original):
const GEO = {
  // Franja (sólo para cálculo de posiciones; la franja ya está en la imagen)
  BANNER_LEFT:   0.12,
  BANNER_RIGHT:  0.88,
  BANNER_TOP:    0.24,
  BANNER_HEIGHT: 0.06,

  // Áreas de ancho útil
  MAXW_MODEL: 0.94 * (0.88 - 0.12), // relativo al ancho total (se multiplicará luego)
  MAXW_SUB:   0.72,
  MAXW_PRICE: 0.86,
  MAXW_DET:   0.82,

  // Tamaños objetivo de las fuentes (en % del alto)
  TARGET_MODEL: 0.071,
  TARGET_SUB:   0.033,
  TARGET_PRICE: 0.137,
  TARGET_DET:   0.030,

  // Posiciones verticales (Y, como % del alto)
  Y_SUB:    0.317,
  Y_PRICE:  0.440,
  Y_DETAIL: 0.590
};

// --- Utilidades de formato ---
const clMiles = (n) => Number(n).toLocaleString("es-CL").replace(/\./g, "."); // seguridad
const onlyDigits = (s) => (s || "").toString().replace(/[^\d]/g, "");
const fmtPrecio = (v) => {
  const d = onlyDigits(v) || "0";
  return "$" + clMiles(d);
};
const fmtKm = (v) => {
  const d = onlyDigits(v) || "0";
  return clMiles(d) + " km";
};
const ensureCc = (s) => {
  const t = (s || "").trim();
  return /cc\b/i.test(t) ? t : (t ? `${t} cc` : "");
};
const splitEquipamiento = (txt) =>
  (txt || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

// Estilo E1: L1: "km , item1" | L2: "item2 , item3" | L3: "item4" | ...
const buildE1Lines = (kmTxt, items) => {
  const L = [];
  if (kmTxt && items.length) {
    L.push(`${kmTxt} , ${items[0]}`);
    items = items.slice(1);
  } else if (kmTxt) {
    L.push(kmTxt);
  }
  for (let i = 0; i < items.length; i += 2) {
    if (i + 1 < items.length) L.push(`${items[i]} , ${items[i + 1]}`);
    else L.push(items[i]);
  }
  return L;
};

// --- Canvas helpers ---
function fitFont(ctx, text, maxWidth, maxHeight, targetPx, minPx = 10) {
  // Empieza en targetPx y baja hasta que quepa
  let size = Math.max(targetPx, minPx);
  ctx.font = `600 ${size}px Inter, Arial, sans-serif`;
  let width = ctx.measureText(text).width;
  let metrics = ctx.measureText(text);
  let height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  while ((width > maxWidth || (maxHeight && height > maxHeight)) && size > minPx) {
    size -= 2;
    ctx.font = `600 ${size}px Inter, Arial, sans-serif`;
    width = ctx.measureText(text).width;
    metrics = ctx.measureText(text);
    height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  }
  return { size, width, height };
}

function drawCenteredText(ctx, text, y, maxWidth, weight = 600, color = "#000") {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${ctx._currentSize || 24}px Inter, Arial, sans-serif`;
  const w = ctx.measureText(text).width;
  const x = (ctx.canvas.width - w) / 2;
  ctx.fillText(text, x, y);
}

(async function main(){
  const modeloEl = document.getElementById("modelo");
  const anioEl = document.getElementById("anio");
  const cilindradaEl = document.getElementById("cilindrada");
  const versionEl = document.getElementById("version");
  const precioEl = document.getElementById("precio");
  const kmEl = document.getElementById("km");
  const equipamientoEl = document.getElementById("equipamiento");

  const btnGenerar = document.getElementById("btnGenerar");
  const btnDescargar = document.getElementById("btnDescargar");
  const btnLimpiar = document.getElementById("btnLimpiar");

  const canvas = document.getElementById("lienzo");
  const ctx = canvas.getContext("2d");

  // Carga de plantilla
  const plantilla = new Image();
  plantilla.src = TEMPLATE_SRC;
  await new Promise((res, rej) => { plantilla.onload = res; plantilla.onerror = rej; });

  // Ajusta el canvas al tamaño nativo de la plantilla (se ve más nítido)
  canvas.width = plantilla.naturalWidth;
  canvas.height = plantilla.naturalHeight;

  function generar(){
    // Limpiar
    ctx.clearRect(0,0,canvas.width, canvas.height);
    // Dibujar plantilla
    ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);

    const W = canvas.width, H = canvas.height;

    // Geometría derivada
    const bannerLeft = GEO.BANNER_LEFT * W;
    const bannerRight = GEO.BANNER_RIGHT * W;
    const bannerTop = GEO.BANNER_TOP * H;
    const bannerHeight = GEO.BANNER_HEIGHT * H;

    const maxwModel = GEO.MAXW_MODEL * (bannerRight - bannerLeft);
    const maxwSub   = GEO.MAXW_SUB * W;
    const maxwPrice = GEO.MAXW_PRICE * W;
    const maxwDet   = GEO.MAXW_DET * W;

    // Lectura & formateo
    const modelo = (modeloEl.value || "").trim();
    const anio = (anioEl.value || "").trim();
    const cilindrada = ensureCc(cilindradaEl.value);
    const version = (versionEl.value || "").trim();

    const precioTxt = fmtPrecio(precioEl.value);
    const kmTxt = fmtKm(kmEl.value);

    const items = splitEquipamiento(equipamientoEl.value);
    const detailLines = buildE1Lines(kmTxt, items);

    const subtitle = `${anio} ${cilindrada} ${version}`.trim();

    // --- Modelo (blanco, dentro de la franja) ---
    ctx.fillStyle = "#fff";
    // Calzar dentro del alto del banner y ancho útil:
    let r = fitFont(ctx, modelo || " ", maxwModel, bannerHeight - 6, GEO.TARGET_MODEL * H);
    ctx.font = `800 ${r.size}px Inter, Arial, sans-serif`;
    ctx._currentSize = r.size;
    // Y centrado vertical exacto en la franja:
    const yModelBase = bannerTop + (bannerHeight - r.height) / 2 + r.height * 0.85; // compensación métrica
    const xModel = (W - ctx.measureText(modelo).width) / 2;
    ctx.fillText(modelo, xModel, yModelBase);

    // --- Subtítulo (negro, debajo del banner) ---
    ctx.fillStyle = "#000";
    r = fitFont(ctx, subtitle || " ", maxwSub, null, GEO.TARGET_SUB * H);
    ctx.font = `700 ${r.size}px Inter, Arial, sans-serif`;
    const ySub = GEO.Y_SUB * H;
    const xSub = (W - ctx.measureText(subtitle).width) / 2;
    ctx.fillText(subtitle, xSub, ySub);

    // --- Precio (grande) ---
    r = fitFont(ctx, precioTxt, maxwPrice, null, GEO.TARGET_PRICE * H);
    ctx.font = `800 ${r.size}px Inter, Arial, sans-serif`;
    const yPrice = GEO.Y_PRICE * H;
    const xPrice = (W - ctx.measureText(precioTxt).width) / 2;
    ctx.fillText(precioTxt, xPrice, yPrice);

    // --- Detalle (multilínea E1) ---
    let y = GEO.Y_DETAIL * H;
    for (const line of detailLines){
      r = fitFont(ctx, line, maxwDet, null, GEO.TARGET_DET * H);
      ctx.font = `400 ${r.size}px Inter, Arial, sans-serif`;
      const x = (W - ctx.measureText(line).width) / 2;
      ctx.fillText(line, x, y);
      y += r.size * 1.30; // interlineado
    }

    btnDescargar.disabled = false;
  }

  function descargar(){
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "publicacion_franval.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function limpiar(){
    modeloEl.value = "";
    anioEl.value = "";
    cilindradaEl.value = "";
    versionEl.value = "";
    precioEl.value = "";
    kmEl.value = "";
    equipamientoEl.value = "";
    btnDescargar.disabled = true;

    // Redibuja sólo la plantilla
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);
  }

  // Eventos
  btnGenerar.addEventListener("click", generar);
  btnDescargar.addEventListener("click", descargar);
  btnLimpiar.addEventListener("click", limpiar);

  // Primera carga: mostrar plantilla
  ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);
})();
