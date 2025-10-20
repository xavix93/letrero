// --- Configuración ---
const TEMPLATE_SRC = "plantilla/plantilla_franval.png"; // Debe existir en tu repo

const GEO = {
  // Franja (sólo para cálculo; la franja está en la imagen)
  BANNER_LEFT:   0.12,
  BANNER_RIGHT:  0.88,
  BANNER_TOP:    0.24,
  BANNER_HEIGHT: 0.06,

  // Áreas de ancho útil
  MAXW_MODEL: 1.20 * (0.88 - 0.12),
  MAXW_SUB:   0.72,
  MAXW_PRICE: 0.86,
  MAXW_DET:   0.82,

  // Tamaños objetivo de las fuentes (en % del alto)
  TARGET_MODEL: 0.071,
  TARGET_SUB:   0.033,
  TARGET_PRICE: 0.137,
  TARGET_DET:   0.030,

  // Posiciones verticales (en % del alto)
  Y_SUB:    0.317,
  Y_PRICE:  0.440,
  Y_DETAIL: 0.590,

  // ⬇️ NUEVO: Offset para subir/bajar “Marca y Modelo”
  // NEGATIVO = SUBE | POSITIVO = BAJA (proporción del alto H)
  MODEL_OFFSET: -0.040
};

// --- Utilidades de formato ---
const onlyDigits = (s) => (s || "").toString().replace(/[^\d]/g, "");
const clMiles = (n) => Number(n).toLocaleString("es-CL").replace(/\./g, ".");
const fmtPrecio = (v) => "$" + clMiles(onlyDigits(v) || "0");
const fmtKm = (v) => clMiles(onlyDigits(v) || "0") + " km";
const ensureCc = (s) => {
  const t = (s || "").trim();
  return /cc\b/i.test(t) ? t : (t ? `${t} cc` : "");
};
const splitEquipamiento = (txt) =>
  (txt || "").split(",").map(s => s.trim()).filter(Boolean);

// Estilo E1 (como el original N400)
const buildE1Lines = (kmTxt, items) => {
  const L = [];
  if (kmTxt && items.length) { L.push(`${kmTxt} , ${items[0]}`); items = items.slice(1); }
  else if (kmTxt) { L.push(kmTxt); }
  for (let i=0;i<items.length;i+=2){
    if (i+1 < items.length) L.push(`${items[i]} , ${items[i+1]}`);
    else L.push(items[i]);
  }
  return L;
};

// --- Canvas helpers ---
function fitFont(ctx, text, maxWidth, maxHeight, targetPx, minPx = 10) {
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

  // Mensaje de estado
  const status = document.createElement("div");
  status.style.marginTop = "8px";
  status.style.fontSize = "12px";
  status.style.color = "#8a8f98";
  document.querySelector(".form-card .actions").appendChild(status);

  // Carga plantilla con manejo de error
  const plantilla = new Image();
  plantilla.crossOrigin = "anonymous";
  plantilla.src = TEMPLATE_SRC;

  const loaded = await new Promise((resolve) => {
    let done = false;
    plantilla.onload = () => { done = true; resolve(true); };
    plantilla.onerror = () => { if (!done) resolve(false); };
    setTimeout(() => { if (!done && plantilla.complete && plantilla.naturalWidth) resolve(true); }, 1000);
  });

  if (!loaded) {
    status.style.color = "#e67c7c";
    status.textContent = "⚠️ No se pudo cargar la plantilla. Verifica /plantilla/plantilla_franval.png";
    btnGenerar.disabled = true;
    btnDescargar.disabled = true;
    return;
  }

  // Tamaño nativo
  canvas.width = plantilla.naturalWidth;
  canvas.height = plantilla.naturalHeight;

  // Dibuja base
  ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);
  btnGenerar.disabled = false;
  btnDescargar.disabled = true;
  status.style.color = "#8bd48b";
  status.textContent = "✅ Plantilla cargada";

  function generar(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);

    const W = canvas.width, H = canvas.height;

    const bannerLeft = GEO.BANNER_LEFT * W;
    const bannerRight = GEO.BANNER_RIGHT * W;
    const bannerTop = GEO.BANNER_TOP * H;
    const bannerHeight = GEO.BANNER_HEIGHT * H;

    const maxwModel = GEO.MAXW_MODEL * (bannerRight - bannerLeft);
    const maxwSub   = GEO.MAXW_SUB * W;
    const maxwPrice = GEO.MAXW_PRICE * W;
    const maxwDet   = GEO.MAXW_DET * W;

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
    let r = fitFont(ctx, modelo || " ", maxwModel, bannerHeight - 6, GEO.TARGET_MODEL * H);
    ctx.font = `800 ${r.size}px Inter, Arial, sans-serif`;

    // ⬇️ AQUÍ ESTÁ EL AJUSTE DE ALTURA
    const yModel =
      bannerTop
      + (bannerHeight - (r.size)) / 2
      + r.size * 0.85
      + GEO.MODEL_OFFSET * H; // NEGATIVO = SUBE

    const xModel = (W - ctx.measureText(modelo).width) / 2;
    ctx.fillText(modelo, xModel, yModel);

    // --- Subtítulo (negro) ---
    ctx.fillStyle = "#000";
    r = fitFont(ctx, subtitle || " ", maxwSub, null, GEO.TARGET_SUB * H);
    ctx.font = `700 ${r.size}px Inter, Arial, sans-serif`;
    const ySub = GEO.Y_SUB * H;
    const xSub = (W - ctx.measureText(subtitle).width) / 2;
    ctx.fillText(subtitle, xSub, ySub);

    // --- Precio ---
    r = fitFont(ctx, precioTxt, maxwPrice, null, GEO.TARGET_PRICE * H);
    ctx.font = `800 ${r.size}px Inter, Arial, sans-serif`;
    const yPrice = GEO.Y_PRICE * H;
    const xPrice = (W - ctx.measureText(precioTxt).width) / 2;
    ctx.fillText(precioTxt, xPrice, yPrice);

    // --- Detalle (E1) ---
    let y = GEO.Y_DETAIL * H;
    for (const line of detailLines){
      r = fitFont(ctx, line, maxwDet, null, GEO.TARGET_DET * H);
      ctx.font = `400 ${r.size}px Inter, Arial, sans-serif`;
      const x = (W - ctx.measureText(line).width) / 2;
      ctx.fillText(line, x, y);
      y += r.size * 1.30;
    }

    btnDescargar.disabled = false;
    status.style.color = "#8bd48b";
    status.textContent = "✅ Previsualización lista";
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
    document.getElementById("modelo").value = "";
    document.getElementById("anio").value = "";
    document.getElementById("cilindrada").value = "";
    document.getElementById("version").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("km").value = "";
    document.getElementById("equipamiento").value = "";
    btnDescargar.disabled = true;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);
    status.style.color = "#8a8f98";
    status.textContent = "Plantilla cargada. Completa los campos y ‘Generar previsualización’.";
  }

  btnGenerar.addEventListener("click", generar);
  btnDescargar.addEventListener("click", descargar);
  btnLimpiar.addEventListener("click", limpiar);
})();
