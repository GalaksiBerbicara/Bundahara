const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const saltRounds = 10;
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// KUNCI RAHASIA (Ganti di file .env nanti)
const JWT_SECRET = "14_des_2006";

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "db_inventaris",
  multipleStatements: true,
});

// --- MIDDLEWARE KEAMANAN (SI SATPAM) ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

  if (!token) return res.status(401).json({ message: "Akses ditolak, Val! Kamu belum login." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token sudah basi atau salah!" });
    req.user = user;
    next();
  });
};

// Middleware khusus untuk Admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // Lanjut kalau admin
  } else {
    res.status(403).json({ message: "Akses ditolak: Anda bukan Admin!" });
  }
};

// --- ENDPOINT LOGIN ---
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (results.length > 0) {
      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role }, // Pastikan role masuk token
          JWT_SECRET,
          { expiresIn: "1d" },
        );

        // INI PENTING: Kirim role yang asli dari database ke frontend
        res.json({
          token,
          user: {
            id: user.id,
            nama: user.username,
            role: user.role, // <--- Pastikan ini user.role dari DB!
          },
        });
      } else {
        res.status(401).json({ message: "Password salah!" });
      }
    } else {
      res.status(401).json({ message: "User tidak ditemukan!" });
    }
  });
});

app.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // 1. Acak password (Hashing)
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. Simpan password yang sudah di-hash ke database
    const query = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
    db.query(query, [username, hashedPassword, role || "staff"], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Username sudah ada!" });
        }
        return res.status(500).json({ message: "Gagal simpan user" });
      }
      res.status(201).json({ message: "Registrasi berhasil!" });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error saat hashing" });
  }
});

// --- ENDPOINT DATA (SEKARANG DIPROTEKSI) ---

// Pakai authenticateToken agar tidak semua orang bisa ambil data
app.get("/barang", authenticateToken, (req, res) => {
  db.query("SELECT * FROM produk", (err, result) => {
    if (err) res.status(500).send(err);
    else res.json(result);
  });
});

db.connect((err) => {
  if (err) console.log("Gagal konek database:", err.message);
  else console.log("Database Bundahara SIAP!");
});

// Endpoint untuk ambil data
app.get("/barang", (req, res) => {
  db.query("SELECT * FROM produk", (err, result) => {
    if (err) res.status(500).send(err);
    else res.json(result);
  });
});


// Hanya Admin yang bisa tambah/hapus/update
app.post("/tambah-barang", authenticateToken, isAdmin, (req, res) => {
  const { nama, kategori, harga, stok } = req.body;
  const username = req.user.username; // Ambil nama dari si pembawa token

  const sql = "INSERT INTO produk (nama_barang, kategori, harga, stok) VALUES (?, ?, ?, ?)";

  db.query(sql, [nama, kategori, harga, stok], (err, result) => {
    if (err) return res.status(500).json(err);

    // --- CATAT KE HISTORY ---
    const sqlLog = "INSERT INTO history (aksi, detail, user, waktu) VALUES (?, ?, ?, NOW())";
    const detail = `Menambah aset baru: ${nama} (${kategori})`;

    db.query(sqlLog, ["TAMBAH", detail, username], (logErr) => {
      res.json({ message: "Berhasil tambah barang dan catat history" });
    });
  });
});

app.delete("/hapus-barang/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const username = req.user.username;

  // 1. Ambil nama barang dulu untuk log history
  db.query("SELECT nama_barang FROM produk WHERE id = ?", [id], (err, results) => {
    // CEK DISINI: Pastikan results ada dan tidak kosong
    if (err) return res.status(500).json(err);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Barang tidak ditemukan!" });
    }

    const namaBarang = results[0].nama_barang;

    // 2. Jalankan proses hapus
    db.query("DELETE FROM produk WHERE id = ?", [id], (deleteErr) => {
      if (deleteErr) return res.status(500).json(deleteErr);

      // 3. Simpan ke history
      const sqlLog = "INSERT INTO history (aksi, detail, user, waktu) VALUES (?, ?, ?, NOW())";
      const detail = `Menghapus aset: ${namaBarang}`;

      db.query(sqlLog, ["HAPUS", detail, username], (logErr) => {
        res.json({ message: "Berhasil hapus barang dan catat history" });
      });
    });
  });
});

// Endpoint untuk mengedit/update barang
app.put("/update-barang/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { nama, kategori, harga, stok } = req.body;
  const username = req.user.username; // Tahu siapa yang ngedit

  const sql = "UPDATE produk SET nama_barang=?, kategori=?, harga=?, stok=? WHERE id=?";

  db.query(sql, [nama, kategori, harga, stok, id], (err, result) => {
    if (err) return res.status(500).json(err);

    // --- CATAT KE HISTORY ---
    const sqlLog = "INSERT INTO history (aksi, detail, user, waktu) VALUES (?, ?, ?, NOW())";
    const detail = `Memperbarui aset: ${nama}`;

    db.query(sqlLog, ["UPDATE", detail, username], (logErr) => {
      res.json({ message: "Data Bundahara berhasil diperbarui!" });
    });
  });
});

// Ambil semua riwayat
app.get("/history", (req, res) => {
  db.query("SELECT * FROM history ORDER BY waktu DESC", (err, result) => {
    res.send(result);
  });
});

// Tambah riwayat baru
app.post("/tambah-history", authenticateToken, (req, res) => {
  const { aksi, detail } = req.body;
  const username = req.user.username; // AMBIL NAMA NYATA DARI TOKEN

  db.query("INSERT INTO history (aksi, detail, user, waktu) VALUES (?, ?, ?, NOW())", [aksi, detail, username], (err, result) => {
    if (err) return res.status(500).json(err);
    res.send(result);
  });
});

// Hapus semua riwayat
app.delete("/hapus-semua-history", authenticateToken, isAdmin, (req, res) => {
  db.query("DELETE FROM history", (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Semua riwayat berhasil dihapus" });
  });
});

// Hapus satu riwayat berdasarkan ID
app.delete("/hapus-history/:id", authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM history WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Satu riwayat berhasil dihapus" });
  });
});

app.post("/bulk-tambah-barang", authenticateToken, (req, res) => {
  // 1. Cek Hak Akses
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Waduh Val, cuma Admin yang boleh import data!" });
  }

  const { data } = req.body;

  // 2. Validasi Struktur Data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: "Datanya kosong atau formatnya salah tuh." });
  }

  // 3. Sanitasi & Filter (Membersihkan data sampah/kosong)
  const cleanValues = data
    .filter((item) => (item.nama_barang || item.nama) && item.kategori) // Buang yang gak ada nama/kategori
    .map((item) => [
      (item.nama_barang || item.nama).substring(0, 255), // Batasi panjang karakter
      item.kategori.substring(0, 100),
      Math.abs(parseInt(item.harga)) || 0, // Pastikan angka positif
      Math.abs(parseInt(item.stok)) || 0,
    ]);

  if (cleanValues.length === 0) {
    return res.status(400).json({ message: "Semua data di Excel kamu kosong atau tidak valid!" });
  }

  // 4. Proses Simpan
  const sql = "INSERT INTO produk (nama_barang, kategori, harga, stok) VALUES ?";
  db.query(sql, [cleanValues], (err, result) => {
    if (err) return res.status(500).json({ error: "Gagal simpan ke database" });

    res.status(200).json({
      message: `Mantap Val! ${result.affectedRows} aset berhasil di-import.`,
      affectedRows: result.affectedRows,
    });
  });
});

const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post("http://localhost:5000/login", credentials);

    // Simpan token dan data user ke localStorage
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("role", response.data.role);
    localStorage.setItem("username", response.data.username);

    setIsLoggedIn(true);
    setUser({ username: response.data.username, role: response.data.role });
    alert("Selamat datang, " + response.data.username);
  } catch (err) {
    alert(err.response?.data?.message || "Login Gagal!");
  }
};

app.listen(5000, () => console.log("Server Bundahara jalan di port 5000"));
