
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '11122009',
  database: process.env.DB_NAME || 'db_peminjaman_alat'
});

// Test koneksi database
pool.query('SELECT NOW()')
  .then(result => console.log('Database terhubung:', result.rows[0].now))
  .catch(error => console.error('Database gagal:', error.message));

// Helper query
async function run(res, sql, params = [], status = 200) {
  try {
    const result = await pool.query(sql, params);

    if (result.rows.length === 0 && sql.trim().toUpperCase().startsWith('UPDATE')) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }

    res.status(status).json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ error: error.message });
  }
}

// HOME
app.get('/', (req, res) => {
  res.json({ message: 'API jalan' });
});

// ========================
// KATEGORI ALAT
// ========================

app.get('/api/kategori', (req, res) => {
  run(res, `
    SELECT *
    FROM kategori_alat
    ORDER BY id_kategori
  `);
});

app.post('/api/kategori', (req, res) => {
  const { nama_kategori, deskripsi } = req.body;

  if (!nama_kategori) {
    return res.status(400).json({ error: 'Nama kategori wajib diisi' });
  }

  run(res, `
    INSERT INTO kategori_alat (nama_kategori, deskripsi)
    VALUES ($1, $2)
    RETURNING *
  `, [nama_kategori, deskripsi || null], 201);
});

app.put('/api/kategori/:id', (req, res) => {
  const { nama_kategori, deskripsi } = req.body;

  if (!nama_kategori) {
    return res.status(400).json({ error: 'Nama kategori wajib diisi' });
  }

  run(res, `
    UPDATE kategori_alat
    SET nama_kategori = $1, deskripsi = $2
    WHERE id_kategori = $3
    RETURNING *
  `, [nama_kategori, deskripsi || null, req.params.id]);
});

app.delete('/api/kategori/:id', (req, res) => {
  run(res, `
    DELETE FROM kategori_alat
    WHERE id_kategori = $1
    RETURNING *
  `, [req.params.id]);
});

// ========================
// DATA ALAT
// ========================

app.get('/api/alat', (req, res) => {
  run(res, `
    SELECT a.*, k.nama_kategori
    FROM alat a
    LEFT JOIN kategori_alat k
    ON a.id_kategori = k.id_kategori
    ORDER BY a.id_alat
  `);
});

app.post('/api/alat', (req, res) => {
  const { nama_alat, id_kategori, kondisi, stok, lokasi } = req.body;

  if (!nama_alat || !id_kategori || stok == null || Number(stok) < 0) {
    return res.status(400).json({ error: 'Data alat tidak lengkap atau stok tidak valid' });
  }

  run(res, `
    INSERT INTO alat (nama_alat, id_kategori, kondisi, stok, lokasi)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    nama_alat,
    id_kategori,
    kondisi || 'Baik',
    stok,
    lokasi || null
  ], 201);
});

app.put('/api/alat/:id', (req, res) => {
  const { nama_alat, id_kategori, kondisi, stok, lokasi } = req.body;

  if (!nama_alat || !id_kategori || stok == null || Number(stok) < 0) {
    return res.status(400).json({ error: 'Data alat tidak lengkap atau stok tidak valid' });
  }

  run(res, `
    UPDATE alat
    SET nama_alat = $1,
        id_kategori = $2,
        kondisi = $3,
        stok = $4,
        lokasi = $5
    WHERE id_alat = $6
    RETURNING *
  `, [
    nama_alat,
    id_kategori,
    kondisi || 'Baik',
    stok,
    lokasi || null,
    req.params.id
  ]);
});

app.delete('/api/alat/:id', (req, res) => {
  run(res, `
    DELETE FROM alat
    WHERE id_alat = $1
    RETURNING *
  `, [req.params.id]);
});

// ========================
// PEMINJAMAN
// ========================

app.get('/api/peminjaman', (req, res) => {
  run(res, `
    SELECT p.*, a.nama_alat,
      CASE
        WHEN p.status = 'Dipinjam'
          AND p.tanggal_rencana_kembali < CURRENT_DATE
        THEN 'Terlambat'
        ELSE p.status::TEXT
      END AS status_tampilan
    FROM peminjaman p
    JOIN alat a ON p.id_alat = a.id_alat
    ORDER BY p.id_peminjaman DESC
  `);
});

app.post('/api/peminjaman', (req, res) => {
  const {
    id_alat,
    nama_peminjam,
    kelas,
    jumlah,
    tanggal_rencana_kembali
  } = req.body;

  if (
    !id_alat ||
    !nama_peminjam ||
    !kelas ||
    !Number.isInteger(Number(jumlah)) ||
    Number(jumlah) <= 0 ||
    !tanggal_rencana_kembali
  ) {
    return res.status(400).json({
      error: 'Lengkapi data peminjaman terlebih dahulu'
    });
  }

  run(res, `
    INSERT INTO peminjaman (
      id_alat,
      nama_peminjam,
      kelas,
      jumlah,
      tanggal_rencana_kembali,
      status
    )
    VALUES ($1, $2, $3, $4, $5, 'Dipinjam')
    RETURNING *
  `, [
    id_alat,
    nama_peminjam,
    kelas,
    jumlah,
    tanggal_rencana_kembali
  ], 201);
});

app.put('/api/peminjaman/:id/kembali', (req, res) => {
  run(res, `
    UPDATE peminjaman
    SET status = 'Dikembalikan',
        tanggal_kembali = CURRENT_DATE
    WHERE id_peminjaman = $1
      AND status = 'Dipinjam'
    RETURNING *
  `, [req.params.id]);
});

// ========================
// SERVER
// ========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server jalan di port ${PORT}`);
});
