import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { Package, Edit2, X, Search, LayoutDashboard, Printer, Home } from "lucide-react";

// Import Halaman & Komponen (Nanti kita buat filenya)
import Sidebar from "./components/sidebar";
import Login from "./pages/login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ManajemenAset from "./pages/ManajemenAset";

const ProtectedRoute = ({ children, roleRequired }) => {
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  // 1. Kalau gak ada token, tendang ke login
  if (!token) return <Navigate to="/login" />;

  // 2. Kalau butuh role admin tapi yang login staff, tendang ke dashboard
  if (roleRequired && user?.role !== roleRequired) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  // --- 1. STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [barang, setBarang] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ nama: "", kategori: "", harga: "", stok: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [showAlert, setShowAlert] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "nama_barang", direction: "asc" });
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  const hasLowStock = barang.some((b) => b.stok < 10);

  // --- 2. COMPUTED LOGIC (Data yang diolah) ---
  // Efek Cek Login
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(savedUser)); // <--- INI PENTING!
    }
    setLoading(false);
  }, []);

  // Efek Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark"); // Simpan 'dark' ke memori
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light"); // Simpan 'light' ke memori
    }
  }, [darkMode]);

  // Efek Ambil Data Awal
  useEffect(() => {
    const token = localStorage.getItem("token");
    // Hanya ambil data jika status isLoggedIn TRUE dan token ADA
    if (isLoggedIn && token) {
      fetchBarang();
      fetchHistory();
    }
  }, [isLoggedIn]); // Dia hanya akan nembak API SETELAH login berhasil

  // Efek Kategori Baru (SweetAlert)
  useEffect(() => {
    if (form.kategori === "new") {
      Swal.fire({
        title: "Kategori Baru",
        input: "text",
        inputLabel: "Masukkan nama kategori baru",
        showCancelButton: true,
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#94a3b8",
        confirmButtonText: "Simpan",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          setForm({ ...form, kategori: result.value });
        } else {
          setForm({ ...form, kategori: "" }); // Reset kalau batal
        }
      });
    }
  }, [form.kategori]);

  const filteredBarang = barang.filter((b) => {
    const matchCategory = selectedCategory === "Semua" || b.kategori === selectedCategory;
    const matchSearch =
      b.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) || b.kategori.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const sortedBarang = [...filteredBarang].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    if (sortConfig.key === "harga" || sortConfig.key === "stok") {
      valA = Number(valA);
      valB = Number(valB);
    }

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const categories = ["Semua", ...new Set(barang.map((b) => b.kategori))].map((cat) => ({
    name: cat,
    count: cat === "Semua" ? barang.length : barang.filter((b) => b.kategori === cat).length,
  }));

  const totalNilaiFiltered = filteredBarang.reduce((acc, curr) => acc + Number(curr.harga) * Number(curr.stok), 0);
  const asetTermahal = filteredBarang.length > 0 ? [...filteredBarang].sort((a, b) => b.harga - a.harga)[0] : null;
  const totalNilaiAset = barang.reduce((acc, curr) => acc + Number(curr.harga) * Number(curr.stok), 0);

  const handleLogout = () => {
    console.log(currentUser);
    // Ambil nama dari state currentUser. Jika tidak ada, fallback ke "User"
    const namaUser = currentUser?.nama || "User";

    Swal.fire({
      title: "Konfirmasi Log Out",
      // Menggunakan template literal agar nama berubah sesuai user yang login
      text: `${namaUser}, apakah kamu yakin ingin mengakhiri sesi ini?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      reverseButtons: true,

      background: darkMode ? "#0f172a" : "#ffffff",
      color: darkMode ? "#f1f5f9" : "#1e293b",
      iconColor: "#f43f5e",
      confirmButtonColor: "#f43f5e",
      cancelButtonColor: darkMode ? "#334155" : "#94a3b8",

      customClass: {
        popup: "rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-md",
        title: "text-xl font-bold tracking-tight",
        confirmButton: "px-6 py-2.5 rounded-xl font-bold uppercase text-xs tracking-widest transition-transform active:scale-95",
        cancelButton: "px-6 py-2.5 rounded-xl font-bold uppercase text-xs tracking-widest transition-transform active:scale-95",
      },

      showClass: {
        popup: "animate__animated animate__fadeInUp animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutDown animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        setIsLoggedIn(false);
        setCurrentUser(null);

        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });

        Toast.fire({
          icon: "success",
          // Di sini juga kita ganti agar lebih personal
          title: `Berhasil keluar. Sampai jumpa, ${namaUser}!`,
        });
      }
    });
  };

  // --- 3. ACTION HANDLERS ---
  const fetchBarang = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("http://localhost:5000/barang", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBarang(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        // Pakai Toast kecil saja di pojok, lebih kencang & estetik
        Toast.fire({
          icon: "error",
          title: "Sesi berakhir, silakan login kembali",
        });
        setIsLoggedIn(false);
        localStorage.clear();
      }
    }
  };

  const fetchHistory = () => {
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:5000/history", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setHistory(res.data))
      .catch((err) => console.error("Gagal ambil history:", err));
  };

  const addHistory = async (aksi, detail) => {
    try {
      const logData = {
        aksi,
        detail,
        user: currentUser?.nama || "Unknown", // Pakai nama dari state login
        waktu: new Date().toISOString(),
      };
      await axios.post("http://localhost:5000/history", logData);
      fetchHistory();
    } catch (err) {
      console.error("Gagal catat history");
    }
  };

  const handleHapus = (id) => {
    const barangDihapus = barang.find((b) => b.id === id);
    const token = localStorage.getItem("token"); // Ambil token

    Swal.fire({
      title: "Yakin ingin menghapus?",
      text: `Aset "${barangDihapus?.nama_barang}" akan dihapus permanen!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        // Tambahkan headers Authorization agar tidak 401
        axios
          .delete(`http://localhost:5000/hapus-barang/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(() => {
            // addHistory dihapus karena sudah di-handle otomatis oleh Backend
            fetchBarang();
            Toast.fire({
              icon: "success",
              title: "Aset telah dihapus",
            });
          })
          .catch((err) => {
            console.error(err);
            Swal.fire("Gagal!", "Kamu tidak memiliki akses atau sesi habis.", "error");
          });
      }
    });
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Ambil Token
    const token = localStorage.getItem("token");

    // 2. CEK DUPLIKAT
    const isDuplicate = barang.some((b) => b.nama_barang.toLowerCase() === form.nama.toLowerCase() && b.id !== editId);

    if (isDuplicate) {
      return Swal.fire({
        icon: "error",
        title: "Nama Barang Sudah Ada!",
        text: "Gunakan nama lain atau edit barang yang sudah ada.",
        confirmButtonColor: "#4f46e5",
      });
    }

    // 3. Konfigurasi Header (Kunci buat masuk ke Backend)
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    // 4. Eksekusi Request dengan Token
    const action = isEditing
      ? axios.put(`http://localhost:5000/update-barang/${editId}`, form, config)
      : axios.post("http://localhost:5000/tambah-barang", form, config);

    action
      .then(() => {
        // NOTE: addHistory manual dihapus karena Backend sudah otomatis mencatat history
        // agar data 'User: {log.user}' muncul secara otomatis dan akurat.

        setForm({ nama: "", kategori: "", harga: "", stok: "" });
        setIsEditing(false);
        fetchBarang();

        Toast.fire({
          icon: "success",
          title: isEditing ? "Data diperbarui" : "Barang didaftarkan",
        }).then(() => {
          setTimeout(() => nameInputRef.current?.focus(), 100);
        });
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.status === 401) {
          Swal.fire("Error", "Sesi habis, silakan login ulang!", "error");
        } else {
          Swal.fire("Error", "Gagal menyimpan data! Pastikan kamu Admin.", "error");
        }
      });
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setForm({
      nama: item.nama_barang,
      kategori: item.kategori,
      harga: item.harga,
      stok: item.stok,
    });
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  useEffect(() => {
    if (hasLowStock) setShowAlert(true);
  }, [hasLowStock]);

  const getStockStatus = (stok) => {
    // 1. Status HABIS (Stok benar-benar nol)
    if (stok === 0 || stok === "0")
      return {
        label: "HABIS",
        color: "bg-red-500 text-white border-red-600 shadow-sm animate-pulse", // Merah solid + Kedip
      };

    // 2. Status TIPIS (Stok di bawah 10 tapi tidak nol)
    if (stok < 10)
      return {
        label: "TIPIS",
        color: "bg-amber-100 text-amber-700 border-amber-200", // Kuning/Amber lembut
      };

    // 3. Status AMAN (Stok 10 ke atas)
    return {
      label: "AMAN",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200", // Hijau tenang
    };
  };

  // Fungsi mengubah angka ke Format Rupiah (untuk tampilan)
  const formatRupiah = (angka) => {
    if (!angka) return "Rp 0";
    const stringAngka = angka.toString().replace(/\D/g, ""); // ambil angka saja
    return "Rp " + stringAngka.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

  // Fungsi mengubah Rupiah ke Angka Murni (untuk dikirim ke Database)
  const cleanRupiah = (string) => {
    return parseInt(string.replace(/\D/g, "")) || 0;
  };

  const exportToExcel = () => {
    const dataExport = barang.map((item, index) => ({
      "No": index + 1, // Nomor urut otomatis
      "Nama Barang": item.nama_barang,
      "Kategori": item.kategori,
      "Harga Satuan": item.harga,
      "Stok": item.stok,
      "Total Nilai Aset": item.harga * item.stok,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Inventaris");

    // Nama file otomatis pakai tanggal hari ini
    XLSX.writeFile(workbook, `Laporan_Aset_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Tambahkan ini: Hitung total stok dari barang yang difilter
  const totalStokFiltered = filteredBarang.reduce((acc, curr) => acc + Number(curr.stok), 0);

  const clearHistory = () => {
    Swal.fire({
      title: "Hapus Semua Riwayat?",
      text: "Tindakan ini tidak bisa dibatalkan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Bersihkan!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        // Panggil API untuk hapus di database
        axios
          .delete("http://localhost:5000/hapus-semua-history")
          .then(() => {
            setHistory([]); // Kosongkan tampilan di React
            Toast.fire({
              icon: "success",
              title: "Riwayat telah dibersihkan",
            });
          })
          .catch((err) => {
            Swal.fire("Gagal!", "Terjadi kesalahan saat menghapus database.", "error");
          });
      }
    });
  };

  const deleteOneHistory = (id) => {
    axios.delete(`http://localhost:5000/hapus-history/${id}`).then(() => {
      // Update tampilan tanpa perlu refresh
      setHistory(history.filter((log) => log.id !== id));
      Toast.fire({
        icon: "success",
        title: "Riwayat terpilih dihapus",
      });
    });
  };

  // Barang yang paling kritis (stok terendah tapi bukan 0)
  const stokKritisCount = filteredBarang.filter((b) => b.stok > 0 && b.stok <= 5).length;

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <Router>
      <div className="min-h-screen flex font-sans transition-colors duration-500 bg-slate-50 dark:bg-slate-800 text-slate-900">
        {/* SIDEBAR: Hanya muncul jika sudah login */}
        {isLoggedIn && <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} setIsLoggedIn={setIsLoggedIn} />}

        {/* MAIN CONTENT */}
        <main className={`flex-1 overflow-y-auto ${isLoggedIn ? "p-8" : ""}`}>
          <Routes>
            <Route path="/register" element={<Register />} />

            {/* Rute Login: Jika sudah login, otomatis lempar ke dashboard */}
            <Route
              path="/login"
              element={!isLoggedIn ? <Login setIsLoggedIn={setIsLoggedIn} setCurrentUser={setCurrentUser} /> : <Navigate to="/dashboard" />}
            />

            {/* Redirect dari "/" ke "/dashboard" */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* PROTECTED ROUTES: Pakai pengecekan isLoggedIn */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard barang={barang} formatRupiah={formatRupiah} darkMode={darkMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/aset"
              element={
                isLoggedIn ? (
                  <ProtectedRoute>
                    <ManajemenAset
                      currentUser={currentUser}
                      barang={barang}
                      setBarang={setBarang}
                      fetchBarang={fetchBarang}
                      addHistory={addHistory}
                      filteredBarang={filteredBarang}
                      sortedBarang={sortedBarang}
                      categories={categories}
                      handleSubmit={handleSubmit}
                      form={form}
                      setForm={setForm}
                      isEditing={isEditing}
                      setIsEditing={setIsEditing}
                      handleEdit={handleEdit}
                      handleHapus={handleHapus}
                      formatRupiah={formatRupiah}
                      cleanRupiah={cleanRupiah}
                      setSelectedCategory={setSelectedCategory}
                      selectedCategory={selectedCategory}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      handlePrint={handlePrint}
                      exportToExcel={exportToExcel}
                      sortConfig={sortConfig}
                      setSortConfig={setSortConfig}
                      getStockStatus={getStockStatus}
                      showAlert={showAlert}
                      setShowAlert={setShowAlert}
                      hasLowStock={hasLowStock}
                      isDropdownOpen={isDropdownOpen}
                      setIsDropdownOpen={setIsDropdownOpen}
                      history={history}
                      deleteOneHistory={deleteOneHistory}
                      clearHistory={clearHistory}
                    />
                  </ProtectedRoute>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* Jika URL tidak dikenal, balikkan ke dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
