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
  database: process.env.DB_NAME || 'db_peminjaman_alat',
});

pool.query('SELECT NOW()')
  .then(r => console.log('DB terhubung:', r.rows[0].now))
  .catch(err => console.log('DB gagal:', err.message));

// Helper query + tangkap error trigger (RAISE EXCEPTION)
const run = (res, sql, params = [], status = 200) =>
  pool.query(sql, params)
    .then(r => res.status(status).json(r.rows))
    .catch(err => res.status(400).json({ error: err.message }));

app.get('/', (req, res) => res.json({ message: 'API jalan' }));

// ===== KATEGORI ALAT =====
app.get('/api/kategori', (req, res) =>
  run(res, 'SELECT * FROM kategori_alat ORDER BY id_kategori'));

app.post('/api/kategori', (req, res) => {
  const { nama_kategori, deskripsi } = req.body;
  run(res, 'INSERT INTO kategori_alat (nama_kategori, deskripsi) VALUES ($1, $2) RETURNING *',
    [nama_kategori, deskripsi || null], 201);
});

app.put('/api/kategori/:id', (req, res) => {
  const { nama_kategori, deskripsi } = req.body;
  run(res, 'UPDATE kategori_alat SET nama_kategori=$1, deskripsi=$2 WHERE id_kategori=$3 RETURNING *',
    [nama_kategori, deskripsi || null, req.params.id]);
});

app.delete('/api/kategori/:id', (req, res) =>
  run(res, 'DELETE FROM kategori_alat WHERE id_kategori=$1 RETURNING *', [req.params.id]));

// ===== ALAT =====
app.get('/api/alat', (req, res) =>
  run(res, `SELECT a.*, k.nama_kategori
            FROM alat a LEFT JOIN kategori_alat k ON a.id_kategori = k.id_kategori
            ORDER BY a.id_alat`));

app.post('/api/alat', (req, res) => {
  const { nama_alat, id_kategori, kondisi, stok, lokasi } = req.body;
  run(res, `INSERT INTO alat (nama_alat, id_kategori, kondisi, stok, lokasi) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nama_alat, id_kategori, kondisi || 'Baik', stok, lokasi || null], 201);
});

app.put('/api/alat/:id', (req, res) => {
  const { nama_alat, id_kategori, kondisi, stok, lokasi } = req.body;
  run(res, `UPDATE alat SET nama_alat=$1, id_kategori=$2, kondisi=$3, stok=$4, lokasi=$5
            WHERE id_alat=$6 RETURNING *`,
    [nama_alat, id_kategori, kondisi || 'Baik', stok, lokasi || null, req.params.id]);
});

app.delete('/api/alat/:id', (req, res) =>
  run(res, 'DELETE FROM alat WHERE id_alat=$1 RETURNING *', [req.params.id]));

// ===== PEMINJAMAN =====
app.get('/api/peminjaman', (req, res) =>
  run(res, `SELECT p.*, a.nama_alat
            FROM peminjaman p JOIN alat a ON p.id_alat = a.id_alat
            ORDER BY p.id_peminjaman DESC`));

app.post('/api/peminjaman', (req, res) => {
  const { id_alat, nama_peminjam, kelas, jumlah } = req.body;
  run(res, `INSERT INTO peminjaman (id_alat, nama_peminjam, kelas, jumlah, status)
            VALUES ($1, $2, $3, $4, 'Dipinjam') RETURNING *`,
    [id_alat, nama_peminjam, kelas, jumlah], 201);
});

app.put('/api/peminjaman/:id/kembali', (req, res) =>
  run(res, `UPDATE peminjaman SET status='Dikembalikan', tanggal_kembali=CURRENT_DATE
            WHERE id_peminjaman=$1 RETURNING *`, [req.params.id]));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server jalan di port ' + PORT));