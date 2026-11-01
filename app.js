// Konfigurasi Supabase
const SUPABASE_URL = "https://xtprfzdgesunqnqjzewu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_t-oxi7XbvM-mKOfOjnaaLQ_uQKJvMum";

// Inisialisasi Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Status lokal
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

// 1. Memuat daftar lukisan dan statistik awal
async function initApp() {
  try {
    const { data: drawings, error: drawError } = await supabaseClient
      .from("drawings")
      .select("drawing_no, revision")
      .order("drawing_no", { ascending: true });

    if (drawError) throw drawError;

    drawingSelect.innerHTML = '<option value="">-- Pilih Nomor Gambar --</option>';
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
    console.error("Gagal memuat data awal:", err.message);
    drawingSelect.innerHTML = '<option value="">Gagal menyambung ke Supabase</option>';
  }
}

// 2. Mengambil data BOM berdasarkan gambar terpilih
async function fetchBOM(drawingNo) {
  if (!drawingNo) {
    currentDrawingItems = [];
    searchInput.disabled = true;
    searchInput.value = "";
    renderTable([]);
    return;
  }

  bomTableBody.innerHTML = `<tr><td colspan="10" class="empty-state">Mengambil data BOM untuk ${drawingNo}...</td></tr>`;

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
    console.error("Gagal memuat BOM:", err.message);
    bomTableBody.innerHTML = `<tr><td colspan="10" class="empty-state" style="color: #ef4444;">Ralat memuat data: ${err.message}</td></tr>`;
  }
}

// 3. Filter teks carian
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

// 4. Papar data ke dalam jadual HTML
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

// Event Listeners
drawingSelect.addEventListener("change", (e) => fetchBOM(e.target.value));
searchInput.addEventListener("input", filterAndRender);
document.addEventListener("DOMContentLoaded", initApp);
