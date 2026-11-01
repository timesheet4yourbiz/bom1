// Konfigurasi Supabase
const SUPABASE_URL = "https://tzzvfdoxiculikenvrzl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qbVpf-BVmrLtdJMAnQT96g_f-x79Lma";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentDrawingItems = [];

// Elemen DOM
const drawingSelect = document.getElementById("drawingSelect");
const searchInput = document.getElementById("searchInput");
const bomTableBody = document.getElementById("bomTableBody");
const tableFooter = document.getElementById("tableFooter");
const itemCount = document.getElementById("itemCount");
const totalWeight = document.getElementById("totalWeight");
const totalDrawings = document.getElementById("totalDrawings");
const totalItems = document.getElementById("totalItems");
const csvFileInput = document.getElementById("csvFileInput");
const uploadStatus = document.getElementById("uploadStatus");

// 1. Inisialisasi data awal
async function initApp() {
  try {
    const { data: drawings, error: drawError } = await supabaseClient
      .from("drawings")
      .select("drawing_no, revision")
      .order("drawing_no", { ascending: true });

    if (drawError) throw drawError;

    drawingSelect.innerHTML = '<option value="">-- Pilih Nombor Lukisan --</option>';
    drawings.forEach((d) => {
      const option = document.createElement("option");
      option.value = d.drawing_no;
      option.textContent = `${d.drawing_no} (Rev ${d.revision || "A"})`;
      drawingSelect.appendChild(option);
    });

    totalDrawings.textContent = drawings.length;

    const { count, error: countError } = await supabaseClient
      .from("bom_items")
      .select("*", { count: "exact", head: true });

    if (!countError) {
      totalItems.textContent = count || 0;
    }
  } catch (err) {
    console.error("Ralat pangkalan data:", err.message);
    drawingSelect.innerHTML = '<option value="">Gagal berhubung ke Supabase</option>';
  }
}

// 2. Muat turun senarai BOM lukisan yang dipilih
async function fetchBOM(drawingNo) {
  if (!drawingNo) {
    currentDrawingItems = [];
    searchInput.disabled = true;
    searchInput.value = "";
    renderTable([]);
    return;
  }

  bomTableBody.innerHTML = `<tr><td colspan="10" class="empty-state">Memuat turun data BOM untuk ${drawingNo}...</td></tr>`;

  try {
    const { data, error } = await supabaseClient
      .from("bom_items")
      .select("*")
      .eq("drawing_no", drawingNo)
      .order("pos", { ascending: true });

    if (error) throw error;

    currentDrawingItems = data || [];
    searchInput.disabled = false;
    searchInput.value = "";
    filterAndRender();
  } catch (err) {
    console.error("Ralat:", err.message);
    bomTableBody.innerHTML = `<tr><td colspan="10" class="empty-state" style="color: #ef4444;">Ralat memuat data: ${err.message}</td></tr>`;
  }
}

// 3. Carian pantas
function filterAndRender() {
  const query = searchInput.value.trim().toLowerCase();
  
  if (!query) {
    renderTable(currentDrawingItems);
    return;
  }

  const filtered = currentDrawingItems.filter((item) => {
    const code = (item.item_code || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const spec = (item.specification || "").toLowerCase();
    return code.includes(query) || desc.includes(query) || spec.includes(query);
  });

  renderTable(filtered);
}

// 4. Render ke HTML
function renderTable(items) {
  bomTableBody.innerHTML = "";

  if (items.length === 0) {
    bomTableBody.innerHTML = `<tr><td colspan="10" class="empty-state">Tiada rekod komponen dijumpai.</td></tr>`;
    tableFooter.classList.add("hidden");
    return;
  }

  let weightSum = 0;

  items.forEach((item) => {
    const mass = item.mass_kg ? Number(item.mass_kg) : 0;
    weightSum += mass;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-num">${item.pos ?? "-"}</td>
      <td class="font-num">${item.qty ?? "-"}</td>
      <td class="item-code">${escapeHtml(item.item_code ?? "-")}</td>
      <td><strong>${escapeHtml(item.description ?? "-")}</strong></td>
      <td class="text-right font-num">${item.length ?? "-"}</td>
      <td class="text-right font-num">${item.width ?? "-"}</td>
      <td style="font-size: 0.8125rem; color: #475569;">${escapeHtml(item.specification ?? "-")}</td>
      <td style="font-size: 0.8125rem; color: #64748b;">${escapeHtml(item.material_remark ?? "-")}</td>
      <td class="text-right font-num"><strong>${mass > 0 ? mass.toFixed(1) : "-"}</strong></td>
      <td class="text-center font-num" style="color: #94a3b8;">${escapeHtml(item.rev ?? "")}</td>
    `;
    bomTableBody.appendChild(tr);
  });

  itemCount.textContent = items.length;
  totalWeight.textContent = weightSum.toFixed(1);
  tableFooter.classList.remove("hidden");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 5. Pembaca CSV automatik (Bila anda pilih fail CSV di browser)
if (csvFileInput) {
  csvFileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploadStatus.textContent = `Memuat naik (${i + 1}/${files.length}): ${file.name}...`;

      const cleanName = file.name.replace(".csv", "").replace("_BOM_v2", "").replace("_BOM", "");
      const match = cleanName.match(/(M\d{4}-\d{4}-[A-Z0-9]+?)([A-Z])?$/);
      const drawingNo = match ? match[1] : cleanName;
      const rev = (match && match[2]) ? match[2] : "A";

      // Simpan drawing
      await supabaseClient.from("drawings").upsert(
        { drawing_no: drawingNo, revision: rev },
        { onConflict: "drawing_no" }
      );

      // Bersihkan item lama jika ada
      await supabaseClient.from("bom_items").delete().eq("drawing_no", drawingNo);

      // Baca fail CSV baris demi baris
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      if (lines.length <= 1) continue;

      const headers = lines[0].split(",").map((h) => h.trim().toUpperCase());
      const records = [];

      for (let j = 1; j < lines.length; j++) {
        const cols = lines[j].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
        const row = {};
        headers.forEach((h, idx) => (row[h] = cols[idx] || null));

        const cleanNum = (val) => {
          if (!val) return null;
          const n = parseFloat(val.replace(/[^\d.]/g, ""));
          return isNaN(n) ? null : n;
        };

        records.push({
          drawing_no: drawingNo,
          cat: row["CAT"] || null,
          pos: cleanNum(row["POS"]) ? parseInt(cleanNum(row["POS"])) : null,
          qty: cleanNum(row["QTY"]) ? parseInt(cleanNum(row["QTY"])) : 1,
          item_code: row["ITEM CODE"] || null,
          description: row["DESCRIPTION"] || null,
          length: cleanNum(row["LENGTH"]),
          width: cleanNum(row["WIDTH"]),
          specification: row["SPECIFICATION"] || null,
          material_remark: row["MATERIAL REMARK"] || null,
          mass_kg: cleanNum(row["MASS (KG)"]),
          rev: row["REV"] || null,
        });
      }

      if (records.length > 0) {
        await supabaseClient.from("bom_items").insert(records);
      }
    }

    uploadStatus.textContent = `Selesai! Berjaya muat naik ${files.length} fail CSV ke Supabase.`;
    initApp();
  });
}

// Event Listeners
drawingSelect.addEventListener("change", (e) => fetchBOM(e.target.value));
searchInput.addEventListener("input", filterAndRender);
document.addEventListener("DOMContentLoaded", initApp);
