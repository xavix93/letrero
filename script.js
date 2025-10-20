// === Configuración de plantilla (ruta fija en el repo) ===
const TEMPLATE_SRC = "plantilla/plantilla_franval.png";

// === Geometría (clon Chevrolet N400) ===
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

  // POSICIONES (puedes afinarlas con 0.001)
  Y_SUB:    0.300,
  Y_PRICE:  0.440,
  Y_DETAIL: 0.590,

  // Ajuste fino Modelo (altura dentro del banner)
  MODEL_OFFSET: -0.065
};

// === Lista Equipamiento (Lista 3, larga) ===
const EQUIP_ITEMS = [
  "Aire Acondicionado", "ABS", "Airbags", "Alza Vidrios",
  "Cierre Centralizado", "Bluetooth", "Pantalla Touch",
  "Sensor Estacionamiento", "Cámara Retroceso",
  "Espejos Eléctricos", "Control Crucero",
  "Velocidad Crucero", "Neblineros", "Llantas",
  "AppleCar/AndroidAuto", "Sensor Lluvia",
  "Control Estabilidad ESP"
];

// === Utilidades de formato ===
const onlyDigits = (s) => (s || "").toString().replace(/[^\d]/g, "");
const clMiles = (n) => Number(n).toLocaleString("es-CL").replace(/\./g, ".");
const fmtPrecio = (v) => "$" + clMiles(onlyDigits(v) || "0");
const fmtKm = (v) => clMiles(onlyDigits(v) || "0") + " km";
const ensureCc = (s) => (/cc\b/i.test(s) ? s.trim() : (s ? s.trim() + " cc" : ""));

// === E1a (km en misma línea del primer equipamiento) ===
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

// === Ajuste de fuentes ===
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

// === APP ===
(async function main(){
  const modeloEl = document.getElementById("modelo");
  const anioEl = document.getElementById("anio");
  const cilindradaEl = document.getElementById("cilindrada");
  const versionEl = document.getElementById("version");
  const precioEl = document.getElementById("precio");
  const kmEl = document.getElementById("km");
  const chipsEl = document.getElementById("chips");

  const btnGenerar = document.getElementById("btnGenerar");
  const btnDescargar = document.getElementById("btnDescargar");
  const btnLimpiar = document.getElementById("btnLimpiar");
  const status = document.getElementById("status");

  const canvas = document.getElementById("lienzo");
  const ctx = canvas.getContext("2d");

  const selected = new Set();
  EQUIP_ITEMS.forEach(label => {
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

  canvas.width = plantilla.naturalWidth;
  canvas.height = plantilla.naturalHeight;
  ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);
  status.textContent = "✅ Plantilla cargada";

  function generar(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(plantilla, 0, 0, canvas.width, canvas.height);

    const W = canvas.width, H = canvas.height;

    const bannerTop = GEO.BANNER_TOP * H;
    const bannerHeight = GEO.BANNER_HEIGHT * H;
    const maxwModel = GEO.MAXW_MODEL * (GEO.BANNER_RIGHT - GEO.BANNER_LEFT) * W;

    const modelo = modeloEl.value.trim();
    const subtitle = `${anioEl.value.trim()} ${ensureCc(cilindradaEl.value)} ${versionEl.value.trim()}`.trim();
    const precioTxt = fmtPrecio(precioEl.value);
    const kmTxt = fmtKm(kmEl.value);
    const detailLines = buildE1Lines(kmTxt, Array.from(selected));

    // === Modelo ===
    ctx.fillStyle = "#fff";
    let r = fitFont(ctx, modelo, maxwModel, bannerHeight-6, GEO.TARGET_MODEL*H);
    ctx.font = `800 ${r.size}px Inter, Arial, sans-serif`;
    const yModel = bannerTop + (bannerHeight-r.size)/2 + r.size*0.85 + GEO.MODEL_OFFSET*H;
    ctx.fillText(modelo, (W-ctx.measureText(modelo).width)/2, yModel);

    // === Subtítulo ===
    ctx.fillStyle = "#000";
    r = fitFont(ctx, subtitle, GEO.MAXW_SUB*W, null, GEO.TARGET_SUB*H);
    ctx.font = `700 ${r.size}px Inter, Arial, sans-serif`;
    ctx.fillText(subtitle, (W-ctx.measureText(subtitle).width)/2, GEO.Y_SUB*H);

    // === Precio ===
    r = fitFont(ctx, precioTxt, GEO.MAXW_PRICE*W, null, GEO.TARGET_PRICE*H);
    ctx.font = `800 ${r.size}px Inter, Arial, sans-serif`;
    ctx.fillText(precioTxt, (W-ctx.measureText(precioTxt).width)/2, GEO.Y_PRICE*H);

    // === Equipamiento (E1a) ===
    let y = GEO.Y_DETAIL*H;
    for (const line of detailLines){
      r = fitFont(ctx, line, GEO.MAXW_DET*W, null, GEO.TARGET_DET*H);
      ctx.font = `400 ${r.size}px Inter, Arial, sans-serif`;
      ctx.fillText(line, (W-ctx.measureText(line).width)/2, y);
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
    a.click(); a.remove();
  }

  function limpiar(){
    ["modelo","anio","cilindrada","version","precio","km"].forEach(id => document.getElementById(id).value = "");
    selected.clear();
    document.querySelectorAll(".chip").forEach(ch => ch.classList.remove("active"));
    btnDescargar.disabled = true;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(plantilla,0,0,canvas.width,canvas.height);
    status.textContent = "Plantilla cargada. Completa y genera.";
  }

  btnGenerar.addEventListener("click", generar);
  btnDescargar.addEventListener("click", descargar);
  btnLimpiar.addEventListener("click", limpiar);
})();
