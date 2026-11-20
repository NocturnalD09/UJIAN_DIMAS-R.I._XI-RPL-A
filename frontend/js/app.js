
const API_URL = 'http://localhost:3000/api';

let cacheKategori = [];
let cacheAlat = [];
let cachePeminjaman = [];

// ALERT
function showAlert(pesan, tipe = 'success') {
  const alertBox = document.getElementById('alert-box');

  if (!alertBox) {
    alert(pesan);
    return;
  }

  alertBox.textContent = pesan;
  alertBox.className = `p-3 mb-4 text-sm ${
    tipe === 'error'
      ? 'bg-red-900 text-red-200'
      : 'bg-zinc-800 text-white'
  }`;

  alertBox.classList.remove('hidden');
}

// API REQUEST
async function request(url, options = {}) {
  const response = await fetch(API_URL + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Terjadi kesalahan');
  }

  return data;
}

// FORMAT TANGGAL
function formatTanggal(tanggal) {
  if (!tanggal) return '-';

  const [tahun, bulan, hari] = tanggal.toString().slice(0, 10).split('-');

  return `${hari}/${bulan}/${tahun}`;
}

function tanggalHariIni() {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, '0');
  const hari = String(sekarang.getDate()).padStart(2, '0');

  return `${tahun}-${bulan}-${hari}`;
}

// KATEGORI
async function loadKategori() {
  try {
    cacheKategori = await request('/kategori');

    const list = document.getElementById('list-kategori');
    const select = document.getElementById('alat_id_kategori');

    if (list) {
      list.innerHTML = '';

      cacheKategori.forEach(k => {
        list.innerHTML += `
          <tr class="border-b border-zinc-800">
            <td class="p-3">${k.nama_kategori}</td>
            <td class="p-3">${k.deskripsi || '-'}</td>
            <td class="p-3">
              <button onclick="editKategori(${k.id_kategori})">Edit</button>
              <button onclick="hapusKategori(${k.id_kategori})">Hapus</button>
            </td>
          </tr>
        `;
      });
    }

    if (select) {
      select.innerHTML = '<option value="">Pilih kategori</option>';

      cacheKategori.forEach(k => {
        select.innerHTML += `
          <option value="${k.id_kategori}">
            ${k.nama_kategori}
          </option>
        `;
      });
    }

    updateDashboard();
  } catch (error) {
    console.error(error);
  }
}

async function simpanKategori(e) {
  e.preventDefault();

  const id = document.getElementById('id_kategori')?.value;

  const data = {
    nama_kategori: document.getElementById('nama_kategori').value,
    deskripsi: document.getElementById('deskripsi').value
  };

  try {
    await request(id ? `/kategori/${id}` : '/kategori', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data)
    });

    showAlert('Kategori berhasil disimpan');
    resetFormKategori();
    await loadKategori();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

function editKategori(id) {
  const kategori = cacheKategori.find(k => k.id_kategori === id);
  if (!kategori) return;

  document.getElementById('id_kategori').value = kategori.id_kategori;
  document.getElementById('nama_kategori').value = kategori.nama_kategori;
  document.getElementById('deskripsi').value = kategori.deskripsi || '';
}

function resetFormKategori() {
  document.getElementById('form-kategori')?.reset();

  const id = document.getElementById('id_kategori');
  if (id) id.value = '';
}

async function hapusKategori(id) {
  if (!confirm('Hapus kategori ini?')) return;

  try {
    await request(`/kategori/${id}`, { method: 'DELETE' });
    showAlert('Kategori berhasil dihapus');
    await loadKategori();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// ALAT
async function loadAlat() {
  try {
    cacheAlat = await request('/alat');

    const tabel = document.getElementById('tabel-alat');
    const select = document.getElementById('pinjam_id_alat');

    if (tabel) {
      tabel.innerHTML = '';

      cacheAlat.forEach(a => {
        const aksi = document.getElementById('form-alat')
          ? `
            <td class="p-3">
              <button onclick="editAlat(${a.id_alat})">Edit</button>
              <button onclick="hapusAlat(${a.id_alat})">Hapus</button>
            </td>
          `
          : '';

        tabel.innerHTML += `
          <tr class="border-b border-zinc-800">
            <td class="p-3">${a.nama_alat}</td>
            <td class="p-3">${a.nama_kategori || '-'}</td>
            <td class="p-3">${a.lokasi || '-'}</td>
            <td class="p-3">${a.kondisi}</td>
            <td class="p-3">${a.stok}</td>
            ${aksi}
          </tr>
        `;
      });
    }

    if (select) {
      select.innerHTML = '<option value="">Pilih alat</option>';

      cacheAlat.forEach(a => {
        select.innerHTML += `
          <option value="${a.id_alat}" ${a.stok <= 0 ? 'disabled' : ''}>
            ${a.nama_alat} (Stok: ${a.stok})
          </option>
        `;
      });
    }

    updateDashboard();
  } catch (error) {
    console.error(error);
  }
}

async function simpanAlat(e) {
  e.preventDefault();

  const id = document.getElementById('id_alat')?.value;

  const data = {
    nama_alat: document.getElementById('nama_alat').value,
    id_kategori: Number(document.getElementById('alat_id_kategori').value),
    kondisi: document.getElementById('kondisi').value,
    stok: Number(document.getElementById('stok').value),
    lokasi: document.getElementById('lokasi').value
  };

  try {
    await request(id ? `/alat/${id}` : '/alat', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data)
    });

    showAlert('Data alat berhasil disimpan');
    resetFormAlat();
    await loadAlat();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

function editAlat(id) {
  const alat = cacheAlat.find(a => a.id_alat === id);
  if (!alat) return;

  document.getElementById('id_alat').value = alat.id_alat;
  document.getElementById('nama_alat').value = alat.nama_alat;
  document.getElementById('alat_id_kategori').value = alat.id_kategori;
  document.getElementById('kondisi').value = alat.kondisi;
  document.getElementById('stok').value = alat.stok;
  document.getElementById('lokasi').value = alat.lokasi || '';
}

function resetFormAlat() {
  document.getElementById('form-alat')?.reset();

  const id = document.getElementById('id_alat');
  if (id) id.value = '';
}

async function hapusAlat(id) {
  if (!confirm('Hapus alat ini?')) return;

  try {
    await request(`/alat/${id}`, { method: 'DELETE' });
    showAlert('Alat berhasil dihapus');
    await loadAlat();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// PEMINJAMAN
async function loadPeminjaman() {
  try {
    cachePeminjaman = await request('/peminjaman');

    const tabel = document.getElementById('tabel-peminjaman');

    updateDashboard();

    if (!tabel) return;

    tabel.innerHTML = '';

    cachePeminjaman.forEach(p => {
      tabel.innerHTML += `
        <tr class="border-b border-zinc-800">
          <td class="p-3">${p.nama_peminjam}</td>
          <td class="p-3">${p.kelas}</td>
          <td class="p-3">${p.nama_alat}</td>
          <td class="p-3">${p.jumlah}</td>
          <td class="p-3">${formatTanggal(p.tanggal_pinjam)}</td>
          <td class="p-3">${formatTanggal(p.tanggal_rencana_kembali)}</td>
          <td class="p-3">${formatTanggal(p.tanggal_kembali)}</td>
          <td class="p-3">${p.status_tampilan || p.status}</td>
          <td class="p-3">
            ${
              p.status === 'Dipinjam'
                ? `<button onclick="kembalikanAlat(${p.id_peminjaman})">Kembalikan</button>`
                : 'Selesai'
            }
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error(error);
  }
}

async function simpanPeminjaman(e) {
  e.preventDefault();

  const data = {
    id_alat: Number(document.getElementById('pinjam_id_alat').value),
    nama_peminjam: document.getElementById('nama_peminjam').value.trim(),
    kelas: document.getElementById('kelas').value.trim(),
    jumlah: Number(document.getElementById('jumlah').value),
    tanggal_rencana_kembali: document.getElementById('tanggal_rencana_kembali').value
  };

  if (!data.nama_peminjam || !data.kelas || !data.id_alat || data.jumlah <= 0) {
    showAlert('Lengkapi nama, kelas, alat, dan jumlah terlebih dahulu', 'error');
    return;
  }

  if (!data.tanggal_rencana_kembali) {
    showAlert('Pilih tanggal rencana pengembalian terlebih dahulu', 'error');
    return;
  }

  if (data.tanggal_rencana_kembali <= tanggalHariIni()) {
    showAlert('Tanggal pengembalian harus setelah tanggal peminjaman', 'error');
    return;
  }

  const alat = cacheAlat.find(a => a.id_alat === data.id_alat);

  if (!alat) {
    showAlert('Data alat tidak ditemukan', 'error');
    return;
  }

  if (data.jumlah > Number(alat.stok)) {
    showAlert(`Stok tersedia hanya ${alat.stok}`, 'error');
    return;
  }

  try {
    await request('/peminjaman', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    showAlert('Peminjaman berhasil diajukan');

    document.getElementById('form-peminjaman').reset();

    const tanggalPinjam = document.getElementById('tanggal_pinjam');
    if (tanggalPinjam) tanggalPinjam.value = tanggalHariIni();

    await loadAlat();
    await loadPeminjaman();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

async function kembalikanAlat(id) {
  if (!confirm('Konfirmasi pengembalian alat?')) return;

  try {
    await request(`/peminjaman/${id}/kembali`, {
      method: 'PUT'
    });

    showAlert('Alat berhasil dikembalikan');

    await loadAlat();
    await loadPeminjaman();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// DASHBOARD
function updateDashboard() {
  const kategori = document.getElementById('total-kategori');
  const stok = document.getElementById('total-alat');
  const pinjam = document.getElementById('total-peminjaman');
  const belum = document.getElementById('belum-kembali');

  if (kategori) kategori.textContent = cacheKategori.length;

  if (stok) {
    stok.textContent = cacheAlat.reduce(
      (total, alat) => total + Number(alat.stok),
      0
    );
  }

  if (pinjam) pinjam.textContent = cachePeminjaman.length;

  if (belum) {
    belum.textContent = cachePeminjaman.filter(
      p => p.status === 'Dipinjam'
    ).length;
  }
}

// JALANKAN
document.addEventListener('DOMContentLoaded', async () => {
  const tanggalPinjam = document.getElementById('tanggal_pinjam');

  if (tanggalPinjam) {
    tanggalPinjam.value = tanggalHariIni();
  }

  const tanggalRencana = document.getElementById('tanggal_rencana_kembali');

  if (tanggalRencana) {
    const besok = new Date();
    besok.setDate(besok.getDate() + 1);

    const tahun = besok.getFullYear();
    const bulan = String(besok.getMonth() + 1).padStart(2, '0');
    const hari = String(besok.getDate()).padStart(2, '0');

    tanggalRencana.min = `${tahun}-${bulan}-${hari}`;
  }

  document.getElementById('form-kategori')
    ?.addEventListener('submit', simpanKategori);

  document.getElementById('form-alat')
    ?.addEventListener('submit', simpanAlat);

  document.getElementById('form-peminjaman')
    ?.addEventListener('submit', simpanPeminjaman);

  document.getElementById('btn-batal-kategori')
    ?.addEventListener('click', resetFormKategori);

  document.getElementById('btn-batal-alat')
    ?.addEventListener('click', resetFormAlat);

  await loadKategori();
  await loadAlat();
  await loadPeminjaman();
});
