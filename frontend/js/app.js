const API_URL = 'http://localhost:3000/api';

// Menyimpan cache data untuk keperluan tombol Edit
let cacheKategori = [];
let cacheAlat = [];

// Fungsi Notifikasi Visual (Sukses / Error dari PostgreSQL)
function showAlert(pesan, tipe = 'success') {
  const alertBox = document.getElementById('alert-box');
  alertBox.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'border-green-300', 'bg-red-100', 'text-red-800', 'border-red-300');

  if (tipe === 'error') {
    alertBox.classList.add('bg-red-100', 'text-red-800', 'border-red-300');
  } else {
    alertBox.classList.add('bg-green-100', 'text-green-800', 'border-green-300');
  }

  alertBox.textContent = pesan;
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  setTimeout(() => {
    alertBox.classList.add('hidden');
  }, 5000);
}

// ==========================================
// 1. CRUD KATEGORI ALAT (ON DELETE CASCADE)
// ==========================================
async function loadKategori() {
  try {
    const res = await fetch(`${API_URL}/kategori`);
    cacheKategori = await res.json();

    const listKategori = document.getElementById('list-kategori');
    const selectKategoriAlat = document.getElementById('alat_id_kategori');

    listKategori.innerHTML = '';
    selectKategoriAlat.innerHTML = '<option value="">-- Pilih Kategori --</option>';

    cacheKategori.forEach((kat) => {
      // Isi dropdown di form master alat
      const opt = document.createElement('option');
      opt.value = kat.id_kategori;
      opt.textContent = kat.nama_kategori;
      selectKategoriAlat.appendChild(opt);

      // Isi list kategori
      const li = `
        <li class="py-2 flex justify-between items-center gap-2">
          <div>
            <p class="font-medium text-slate-800">${kat.nama_kategori}</p>
            <p class="text-xs text-slate-500">${kat.deskripsi || '-'}</p>
          </div>
          <div class="flex gap-1.5 shrink-0">
            <button onclick="editKategori(${kat.id_kategori})" class="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 px-2 py-1 rounded">Edit</button>
            <button onclick="hapusKategori(${kat.id_kategori})" class="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded">Hapus</button>
          </div>
        </li>
      `;
      listKategori.insertAdjacentHTML('beforeend', li);
    });
  } catch (err) {
    console.error('Gagal memuat kategori:', err);
  }
}

document.getElementById('form-kategori').addEventListener('submit', async (e) => {
  e.preventDefault();
  const idEdit = document.getElementById('edit_id_kategori').value;
  const payload = {
    nama_kategori: document.getElementById('nama_kategori').value.trim(),
    deskripsi: document.getElementById('deskripsi_kategori').value.trim()
  };

  const url = idEdit ? `${API_URL}/kategori/${idEdit}` : `${API_URL}/kategori`;
  const method = idEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return showAlert(data.error, 'error');

    showAlert(idEdit ? 'Kategori berhasil diperbarui!' : 'Kategori baru ditambahkan!');
    resetFormKategori();
    await loadKategori();
    await loadAlat();
  } catch (err) {
    showAlert('Gagal terhubung ke server.', 'error');
  }
});

function editKategori(id) {
  const kat = cacheKategori.find((k) => k.id_kategori === id);
  if (!kat) return;
  document.getElementById('edit_id_kategori').value = kat.id_kategori;
  document.getElementById('nama_kategori').value = kat.nama_kategori;
  document.getElementById('deskripsi_kategori').value = kat.deskripsi || '';
  document.getElementById('judul-form-kategori').textContent = 'Edit Kategori';
  document.getElementById('btn-submit-kategori').textContent = 'Update Kategori';
  document.getElementById('btn-batal-kategori').classList.remove('hidden');
}

function resetFormKategori() {
  document.getElementById('form-kategori').reset();
  document.getElementById('edit_id_kategori').value = '';
  document.getElementById('judul-form-kategori').textContent = 'Tambah Kategori';
  document.getElementById('btn-submit-kategori').textContent = 'Simpan Kategori';
  document.getElementById('btn-batal-kategori').classList.add('hidden');
}

async function hapusKategori(id) {
  if (!confirm('PERINGATAN (ON DELETE CASCADE): Menghapus kategori ini akan ikut menghapus semua alat di dalamnya. Lanjutkan?')) return;

  try {
    const res = await fetch(`${API_URL}/kategori/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return showAlert(data.error, 'error');

    showAlert('Kategori beserta alat di dalamnya berhasil dihapus.');
    await loadKategori();
    await loadAlat();
  } catch (err) {
    showAlert('Gagal menghapus kategori.', 'error');
  }
}


async function loadAlat() {
  try {
    const res = await fetch(`${API_URL}/alat`);
    cacheAlat = await res.json();

    const tabelAlat = document.getElementById('tabel-alat');
    const selectPinjamAlat = document.getElementById('pinjam_id_alat');

    tabelAlat.innerHTML = '';
    selectPinjamAlat.innerHTML = '<option value="">-- Pilih Alat --</option>';

    cacheAlat.forEach((alat) => {
      // Isi dropdown peminjaman (tetap tampilkan stok agar bisa uji trigger RAISE EXCEPTION jika input melebihi stok)
      const opt = document.createElement('option');
      opt.value = alat.id_alat;
      opt.textContent = `${alat.nama_alat} (Stok: ${alat.stok})`;
      selectPinjamAlat.appendChild(opt);

      const badgeStok = alat.stok > 0
        ? `<span class="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-semibold">${alat.stok}</span>`
        : `<span class="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-semibold">0</span>`;

      const row = `
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-3 font-medium">${alat.nama_alat}</td>
          <td class="py-2.5 px-3 text-slate-600">${alat.nama_kategori || '-'}</td>
          <td class="py-2.5 px-3 text-slate-600">${alat.lokasi || '-'}</td>
          <td class="py-2.5 px-3">${alat.kondisi || 'Baik'}</td>
          <td class="py-2.5 px-3 text-center">${badgeStok}</td>
          <td class="py-2.5 px-3 text-center space-x-1">
            <button onclick="editAlat(${alat.id_alat})" class="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 px-2 py-1 rounded">Edit</button>
            <button onclick="hapusAlat(${alat.id_alat})" class="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded">Hapus</button>
          </td>
        </tr>
      `;
      tabelAlat.insertAdjacentHTML('beforeend', row);
    });
  } catch (err) {
    console.error('Gagal memuat alat:', err);
  }
}

document.getElementById('form-alat').addEventListener('submit', async (e) => {
  e.preventDefault();
  const idEdit = document.getElementById('edit_id_alat').value;
  const payload = {
    nama_alat: document.getElementById('nama_alat').value.trim(),
    id_kategori: parseInt(document.getElementById('alat_id_kategori').value),
    kondisi: document.getElementById('kondisi_alat').value.trim(),
    lokasi: document.getElementById('lokasi_alat').value.trim(),
    stok: parseInt(document.getElementById('stok_alat').value)
  };

  const url = idEdit ? `${API_URL}/alat/${idEdit}` : `${API_URL}/alat`;
  const method = idEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return showAlert(data.error, 'error');

    showAlert(idEdit ? 'Data alat berhasil diupdate!' : 'Alat baru berhasil ditambahkan!');
    resetFormAlat();
    await loadAlat();
  } catch (err) {
    showAlert('Gagal menyimpan data alat.', 'error');
  }
});

function editAlat(id) {
  const alat = cacheAlat.find((a) => a.id_alat === id);
  if (!alat) return;
  document.getElementById('edit_id_alat').value = alat.id_alat;
  document.getElementById('nama_alat').value = alat.nama_alat;
  document.getElementById('alat_id_kategori').value = alat.id_kategori;
  document.getElementById('kondisi_alat').value = alat.kondisi || 'Baik';
  document.getElementById('lokasi_alat').value = alat.lokasi || '';
  document.getElementById('stok_alat').value = alat.stok;

  document.getElementById('judul-form-alat').textContent = 'Edit Master Alat';
  document.getElementById('btn-submit-alat').textContent = 'Update Alat';
  document.getElementById('btn-batal-alat').classList.remove('hidden');
}

function resetFormAlat() {
  document.getElementById('form-alat').reset();
  document.getElementById('edit_id_alat').value = '';
  document.getElementById('kondisi_alat').value = 'Baik';
  document.getElementById('judul-form-alat').textContent = 'Kelola Master Alat';
  document.getElementById('btn-submit-alat').textContent = '+ Tambah Alat';
  document.getElementById('btn-batal-alat').classList.add('hidden');
}

async function hapusAlat(id) {
  if (!confirm('Hapus alat ini dari database?')) return;

  try {
    const res = await fetch(`${API_URL}/alat/${id}`, { method: 'DELETE' });
    const data = await res.json();

    // Menangkap error ON DELETE RESTRICT jika alat terikat dengan tabel peminjaman
    if (!res.ok) {
      if (data.error && data.error.includes('foreign key constraint')) {
        return showAlert('Gagal menghapus: Alat ini sedang dipinjam atau tercatat dalam riwayat transaksi (ON DELETE RESTRICT).', 'error');
      }
      return showAlert(data.error, 'error');
    }

    showAlert('Alat berhasil dihapus.');
    await loadAlat();
  } catch (err) {
    showAlert('Gagal menghapus alat.', 'error');
  }
}

// ==========================================
// 3. TRANSAKSI PEMINJAMAN & PENGEMBALIAN
// ==========================================
async function loadPeminjaman() {
  try {
    const res = await fetch(`${API_URL}/peminjaman`);
    const dataPeminjaman = await res.json();

    const tabelPeminjaman = document.getElementById('tabel-peminjaman');
    tabelPeminjaman.innerHTML = '';

    if (dataPeminjaman.length === 0) {
      tabelPeminjaman.innerHTML = `
        <tr>
          <td colspan="7" class="py-4 text-center text-slate-500">Belum ada data peminjaman.</td>
        </tr>
      `;
      return;
    }

    dataPeminjaman.forEach((item) => {
      const tglPinjam = new Date(item.tanggal_pinjam).toLocaleDateString('id-ID');

      let badgeStatus = '';
      if (item.status === 'Dipinjam') {
        badgeStatus = '<span class="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Dipinjam</span>';
      } else if (item.status === 'Dikembalikan') {
        badgeStatus = '<span class="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium">Dikembalikan</span>';
      } else {
        badgeStatus = `<span class="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">${item.status}</span>`;
      }

      const tombolAksi = item.status === 'Dipinjam'
        ? `<button onclick="kembalikanAlat(${item.id_peminjaman})" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Kembalikan</button>`
        : `<span class="text-slate-400 text-xs">Selesai</span>`;

      const row = `
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-3 font-medium">${item.nama_peminjam}</td>
          <td class="py-2.5 px-3">${item.kelas}</td>
          <td class="py-2.5 px-3">${item.nama_alat}</td>
          <td class="py-2.5 px-3 text-center">${item.jumlah}</td>
          <td class="py-2.5 px-3">${tglPinjam}</td>
          <td class="py-2.5 px-3">${badgeStatus}</td>
          <td class="py-2.5 px-3 text-center">${tombolAksi}</td>
        </tr>
      `;
      tabelPeminjaman.insertAdjacentHTML('beforeend', row);
    });
  } catch (err) {
    console.error('Gagal memuat peminjaman:', err);
  }
}

document.getElementById('form-peminjaman').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    id_alat: parseInt(document.getElementById('pinjam_id_alat').value),
    nama_peminjam: document.getElementById('nama_peminjam').value.trim(),
    kelas: document.getElementById('kelas').value.trim(),
    jumlah: parseInt(document.getElementById('jumlah').value)
  };

  try {
    const res = await fetch(`${API_URL}/peminjaman`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    // Menangkap RAISE EXCEPTION dari trigger update_stok_alat() jika stok tidak cukup
    if (!res.ok) {
      return showAlert(`Ditolak Database: ${data.error}`, 'error');
    }

    showAlert('Peminjaman berhasil dicatat! Stok otomatis berkurang.');
    document.getElementById('form-peminjaman').reset();
    await loadAlat();
    await loadPeminjaman();
  } catch (err) {
    showAlert('Gagal terhubung ke server.', 'error');
  }
});

async function kembalikanAlat(idPeminjaman) {
  if (!confirm('Konfirmasi pengembalian alat ini?')) return;

  try {
    const res = await fetch(`${API_URL}/peminjaman/${idPeminjaman}/kembali`, {
      method: 'PUT'
    });
    const data = await res.json();
    if (!res.ok) return showAlert(data.error, 'error');

    showAlert('Alat berhasil dikembalikan! Stok otomatis bertambah.');
    await loadAlat();
    await loadPeminjaman();
  } catch (err) {
    showAlert('Gagal memproses pengembalian.', 'error');
  }
}

// Inisialisasi awal saat halaman dibuka
document.addEventListener('DOMContentLoaded', async () => {
  await loadKategori();
  await loadAlat();
  await loadPeminjaman();
});