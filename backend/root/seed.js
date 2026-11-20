const pool = require("./db");

const seedDatabase = async () => {
  try {
    console.log("Memulai proses seeding database...");

    // 1. Create tables first
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        category_id INT REFERENCES categories(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        image_url TEXT
      );
    `);

    // 2. Truncate existing data & reset primary key IDs safely
    await pool.query(
      "TRUNCATE TABLE products, categories RESTART IDENTITY CASCADE;"
    );

    // 3. Insert categories
    await pool.query(`
  INSERT INTO kategori_alat (nama_kategori, deskripsi) VALUES 
  ('Komputer & Jaringan', 'Peralatan lab komputer, server, dan jaringan'),
  ('Multimedia', 'Peralatan fotografi, videografi, dan presentasi'),
  ('Elektronika', 'Komponen dan alat ukur kelistrikan');
    `);

    // 4. Insert dummy products
    await pool.query(`
      INSERT INTO alat (id_kategori, nama_alat, kondisi, stok, lokasi) VALUES 
        (1, 'Kabel UTP Cat6 (Roll)', 'Baik', 10, 'Lemari Jaringan A'),
        (1, 'Crimping Tool', 'Baik', 25, 'Lemari Jaringan B'),
        (2, 'Kamera DSLR Canon', 'Baik', 5, 'Loker Multimedia 1'),
        (2, 'Proyektor Epson', 'Baik', 8, 'Loker Multimedia 2'),
        (3, 'Multimeter Digital', 'Baik', 20, 'Rak Elektro C');
    `);

    console.log("Seeding selesai! Tabel dan Data Dummy berhasil dibuat.");
  } catch (err) {
    console.error("Error saat seeding:", err);
  } finally {
    // 5. Close connection pool
    await pool.end();
  }
};

seedDatabase();