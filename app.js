// Konfigurasi Supabase
const SUPABASE_URL = "https://tzzvfdoxiculikenvrzl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qbVpf-BVmrLtdJMAnQT96g_f-x79Lma";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Konfigurasi Gemini API 
const GEMINI_API_KEY = "AQ.Ab8RN6J8NK-SUtR7SsozIvKSPuxLUvLSXWz_I32wJAH6uwR4Nw"; 

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
const pdfFileInput = document.getElementById("pdfFileInput");
const aiStatus = document.getElementById("aiStatus");

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

// 5. Pembaca CSV automatik dengan sekatan fail
if (csvFileInput) {
  csvFileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Sekatan: Tolak jika bukan fail .csv
      if (!file.name.toLowerCase().endsWith(".csv")) {
        uploadStatus.innerHTML = `<span style="color: #dc2626;">❌ Ralat: Fail "${file.name}" bukan CSV! Sila muat naik fail CSV sahaja.</span>`;
        continue;
      }

      uploadStatus.style.color = "#1e40af";
      uploadStatus.textContent = `Memuat naik (${i + 1}/${files.length}): ${file.name}...`;

      const cleanName = file.name.replace(".csv", "").replace("_BOM_v2", "").replace("_BOM", "");
      const match = cleanName.match(/(M\d{4}-\d{4}-[A-Z0-9]+?)([A-Z])?$/);
      const drawingNo = match ? match[1] : cleanName;
      const rev = (match && match[2]) ? match[2] : "A";

      // Baca kandungan fail
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      if (lines.length <= 1) continue;

      const headers = lines[0].split(",").map((h) => h.trim().toUpperCase());

      // Pastikan fail ada format BOM sebenar
      if (!headers.includes("ITEM CODE") && !headers.includes("DESCRIPTION")) {
        uploadStatus.innerHTML = `<span style="color: #dc2626;">❌ Ralat: Format CSV "${file.name}" tidak sah.</span>`;
        continue;
      }

      // Simpan drawing
      await supabaseClient.from("drawings").upsert(
        { drawing_no: drawingNo, revision: rev },
        { onConflict: "drawing_no" }
      );

      await supabaseClient.from("bom_items").delete().eq("drawing_no", drawingNo);

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

    uploadStatus.textContent = `Selesai! Data CSV berjaya diproses.`;
    initApp();
  });
}

// 6. Fungsi Auto-Ekstrak PDF menggunakan Gemini 1.5 Flash
if (pdfFileInput) {
  pdfFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      if(aiStatus) aiStatus.innerHTML = `❌ Sila muat naik fail PDF sahaja.`;
      return;
    }

    if(aiStatus) aiStatus.textContent = `⏳ Membaca PDF: ${file.name}... Sila tunggu (Boleh ambil masa 10-20 saat).`;

    // Ambil Drawing No dari nama fail
    const cleanName = file.name.replace(".pdf", "");
    const match = cleanName.match(/(M\d{4}-\d{4}-[A-Z0-9]+?)([A-Z])?$/);
    const drawingNo = match ? match[1] : cleanName;
    const rev = (match && match[2]) ? match[2] : "A";

    try {
      // Tukar PDF kepada Base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
      });

      // Panggil Gemini API 
      const prompt = `Anda adalah pengekstrak data BOM. Sila cari jadual 'MATERIAL LIST' atau 'COMPONENT LIST' pada lukisan ini. 
      Ekstrak semua baris item BOM.
      Hanya pulangkan data dalam format tatasusunan objek JSON (Array of JSON objects). Tiada penerangan teks, cuma mula dan tamat dengan kurungan [ dan ].
      Format setiap objek mesti mengandungi kunci (keys): 
      "pos", "qty", "item_code", "description", "length", "width", "specification", "material_remark", "mass_kg".
      Jika nombor, jadikan jenis data nombor. Jika kosong atau tiada, biarkan null.`;

      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "application/pdf", data: base64Data } }
          ]
        }]
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error("Gagal menyambung ke Gemini API. Sila periksa API Key.");

      const result = await response.json();
      let aiText = result.candidates[0].content.parts[0].text;
      
      // Bersihkan respons untuk dapatkan JSON tulen
      aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      const records = JSON.parse(aiText);

      if (!records || records.length === 0) {
        throw new Error("Tiada item BOM dijumpai di dalam PDF ini.");
      }

      if(aiStatus) aiStatus.textContent = `✅ AI berjaya membaca ${records.length} item. Sedang menyimpan ke pangkalan data...`;

      // Simpan ke Supabase
      await supabaseClient.from("drawings").upsert(
        { drawing_no: drawingNo, revision: rev },
        { onConflict: "drawing_no" }
      );
      await supabaseClient.from("bom_items").delete().eq("drawing_no", drawingNo);

      // Tambah Drawing No & Rev pada setiap objek
      const finalRecords = records.map(item => ({
        drawing_no: drawingNo,
        cat: item.cat || null,
        pos: item.pos || null,
        qty: item.qty || 1,
        item_code: item.item_code || null,
        description: item.description || null,
        length: item.length || null,
        width: item.width || null,
        specification: item.specification || null,
        material_remark: item.material_remark || null,
        mass_kg: item.mass_kg || null,
        rev: rev
      }));

      await supabaseClient.from("bom_items").insert(finalRecords);

      if(aiStatus) aiStatus.textContent = `🎉 Selesai! Lukisan ${drawingNo} berjaya diekstrak dan disimpan.`;
      initApp(); // Refresh jadual

    } catch (err) {
      console.error(err);
      if(aiStatus) aiStatus.innerHTML = `❌ Ralat AI: ${err.message}`;
    }
  });
}

// Event Listeners
drawingSelect.addEventListener("change", (e) => fetchBOM(e.target.value));
searchInput.addEventListener("input", filterAndRender);
document.addEventListener("DOMContentLoaded", initApp);



// 7. Fungsi Muat Turun CSV
const downloadCsvBtn = document.getElementById("downloadCsvBtn");

if (downloadCsvBtn) {
  downloadCsvBtn.addEventListener("click", () => {
    if (!currentDrawingItems || currentDrawingItems.length === 0) {
      alert("Tiada data untuk dimuat turun.");
      return;
    }

    const drawingNo = document.getElementById("drawingSelect").value;
    const headers = ["CAT", "POS", "QTY", "ITEM CODE", "DESCRIPTION", "LENGTH", "WIDTH", "SPECIFICATION", "MATERIAL REMARK", "MASS (KG)", "REV"];
    
    let csvContent = headers.join(",") + "\n";

    currentDrawingItems.forEach(item => {
      // Pastikan teks yang ada koma dibalut dengan tanda petik (quotes)
      const cleanText = (text) => `"${(text || "").toString().replace(/"/g, '""')}"`;
      
      const row = [
        cleanText(item.cat),
        item.pos || "",
        item.qty || "",
        cleanText(item.item_code),
        cleanText(item.description),
        item.length || "",
        item.width || "",
        cleanText(item.specification),
        cleanText(item.material_remark),
        item.mass_kg || "",
        cleanText(item.rev)
      ];
      csvContent += row.join(",") + "\n";
    });

    // Cipta fail CSV dan mulakan muat turun
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${drawingNo}_BOM.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
