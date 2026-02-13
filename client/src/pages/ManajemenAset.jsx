import { useRef, useEffect, useState } from "react";
import { Plus, Minus, Edit2, Trash2, X, Search, Printer, Package, LayoutDashboard, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import axios from "axios";
import * as XLSX from "xlsx";

const TableEmptyState = ({ currentUser, isSearch, searchTerm, resetSearch }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full" />
      <div className="relative w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
        {isSearch ? (
          <Search size={40} className="text-slate-300 dark:text-slate-600" />
        ) : (
          <Package size={40} className="text-slate-300 dark:text-slate-600" />
        )}
      </div>
    </div>

    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
      {isSearch ? "Pencarian Tidak Ditemukan" : "Belum Ada Aset Terdaftar"}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
      {isSearch
        ? `Maaf Val, barang dengan kata kunci "${searchTerm}" tidak ditemukan di inventaris.`
        : "Mulai kelola inventaris kamu dengan mendaftarkan aset baru pada form di samping."}
    </p>

    {isSearch && (
      <button
        onClick={resetSearch}
        className="mt-6 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all border border-indigo-100 dark:border-indigo-500/20">
        Lihat Semua Barang
      </button>
    )}
  </motion.div>
);

function ManajemenAset({
  barang,
  setBarang,
  fetchBarang,
  addHistory,
  filteredBarang,
  sortedBarang,
  categories,
  handleSubmit,
  form,
  setForm,
  isEditing,
  setIsEditing,
  handleEdit,
  handleHapus,
  formatRupiah,
  cleanRupiah,
  setSelectedCategory,
  selectedCategory,
  setSearchTerm,
  handlePrint,
  exportToExcel,
  sortConfig,
  setSortConfig,
  getStockStatus,
  showAlert,
  setShowAlert,
  hasLowStock,
  isDropdownOpen,
  setIsDropdownOpen,
  history,
  deleteOneHistory,
  clearHistory,
  darkMode,
  searchTerm,
  currentUser
}) {
  const nameInputRef = useRef(null);
  // Logika Statistik Dinamis (Akan berubah saat kamu filter/search)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Kamu bisa ganti jadi 5, 20, atau 50
  const totalNilaiFiltered = filteredBarang.reduce((acc, b) => acc + Number(b.harga) * Number(b.stok), 0);
  const stokKritisCount = filteredBarang.filter((b) => b.stok < 10).length;
  const asetTermahal = filteredBarang.length > 0 ? [...filteredBarang].sort((a, b) => Number(b.harga) - Number(a.harga))[0] : null;
  const [selectedIds, setSelectedIds] = useState([]); // Simpan ID yang dicentang
  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map((b) => b.id)); // Hanya pilih yang tampil di layar
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // filteredBarang adalah data yang sudah kamu filter/search sebelumnya
  const currentItems = sortedBarang.slice(indexOfFirstItem, indexOfLastItem);
  const emptyRows = itemsPerPage - currentItems.length;

  // Hitung total halaman
  const totalPages = Math.ceil(filteredBarang.length / itemsPerPage);

  const handleBulkDelete = () => {
    Swal.fire({
      title: "Hapus Massal?",
      text: `Kamu akan menghapus ${selectedIds.length} aset sekaligus dari database!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, Hapus Semua!",
      cancelButtonText: "Batal",
      background: darkMode ? "#0f172a" : "#ffffff",
      color: darkMode ? "#ffffff" : "#1e293b",
      customClass: { popup: "rounded-[24px]" },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // 1. Ambil nama-nama barang untuk history sebelum dihapus
          const barangTerpilih = barang.filter((b) => selectedIds.includes(b.id));
          const listNama = barangTerpilih.map((b) => b.nama_barang).join(", ");

          // 2. Jalankan proses hapus ke database pakai axios
          // Kita gunakan Promise.all agar semua request jalan bersamaan
          await Promise.all(selectedIds.map((id) => axios.delete(`http://localhost:5000/hapus-barang/${id}`)));

          // 3. Tambahkan ke History (Mirip handleHapus kamu)
          if (typeof addHistory === "function") {
            addHistory("HAPUS", `Menghapus massal aset: ${listNama}`);
          }

          // 4. Refresh data dari server (memanggil fetchBarang di App.jsx via props)
          if (typeof fetchBarang === "function") {
            fetchBarang();
          }

          // 5. Reset pilihan & kasih feedback
          setSelectedIds([]);

          Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: `${barangTerpilih.length} aset telah dihapus selamanya.`,
            timer: 1500,
            showConfirmButton: false,
            background: darkMode ? "#0f172a" : "#ffffff",
            color: darkMode ? "#ffffff" : "#1e293b",
            customClass: { popup: "rounded-[24px]" },
          });
        } catch (error) {
          console.error("Gagal hapus massal:", error);
          Swal.fire({
            icon: "error",
            title: "Gagal!",
            text: "Terjadi kesalahan saat menghapus data di server.",
            background: darkMode ? "#0f172a" : "#ffffff",
            color: darkMode ? "#ffffff" : "#1e293b",
          });
        }
      }
    });
  };

  const CustomCheckbox = ({ checked, onChange }) => (
    <div
      onClick={onChange}
      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
        checked
          ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/30"
          : "border-slate-300 dark:border-slate-600 hover:border-indigo-400"
      }`}>
      {checked && <Check size={14} strokeWidth={4} className="text-white" />}
    </div>
  );

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Sekarang jsonData berisi array of objects dari Excel kamu
      if (jsonData.length > 0) {
        Swal.fire({
          title: "Konfirmasi Import",
          text: `Kamu akan memasukkan ${jsonData.length} data aset sekaligus. Lanjutkan?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Ya, Import Sekarang",
          background: darkMode ? "#0f172a" : "#ffffff",
          color: darkMode ? "#ffffff" : "#1e293b",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              // Kirim ke backend (Pastikan backend kamu punya endpoint bulk-insert)
              await axios.post("http://localhost:5000/bulk-tambah-barang", { data: jsonData });

              fetchBarang(); // Refresh tabel
              addHistory("TAMBAH", `Import massal ${jsonData.length} aset dari Excel`);

              Swal.fire("Berhasil!", "Semua data telah masuk ke database.", "success");
            } catch (err) {
              Swal.fire("Gagal!", "Terjadi kesalahan saat menyimpan data.", "error");
            }
          }
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto pb-10">
      {/* Taruh ini di paling atas main content, dia sembunyi di web tapi muncul di print */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold uppercase">Laporan Inventaris Barang</h1>
        <p className="text-sm">Dicetak pada: {new Date().toLocaleString()}</p>
      </div>
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight no-print">Manajemen Aset</h1>
          <p className="text-slate-500 dark:text-slate-400 no-print">Kelola dan pantau inventaris barang Anda</p>
        </div>
      </div>

      <hr className="mb-6 border-slate-200 dark:border-slate-500" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 no-print">
        {/* Box 1: Total Jenis */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 border-l-indigo-500 dark:border-l-indigo-600 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Jenis Aset</p>
            <p className="text-xl font-black text-slate-800 dark:text-slate-100">{filteredBarang.length}</p>
          </div>
        </div>

        {/* Box 2: Nilai Total */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 dark:border-l-emerald-600 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-sm">
            Rp
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Nilai</p>
            <p className="text-xl font-black text-slate-800 dark:text-slate-100 truncate">{formatRupiah(totalNilaiFiltered)}</p>
          </div>
        </div>

        {/* Box 3: Aset Termahal */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 border-l-orange-500 dark:border-l-orange-600 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
            <Plus size={20} className="rotate-45" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Aset Termahal</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{asetTermahal ? asetTermahal.nama_barang : "-"}</p>
          </div>
        </div>

        {/* Box 4: Stok Kritis */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 border-l-red-500 dark:border-l-red-600 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl font-bold">!</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Stok Kritis</p>
            <p className="text-xl font-black text-slate-800 dark:text-slate-100">
              {stokKritisCount} <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Unit</span>
            </p>
          </div>
        </div>
      </div>

      {/* Banner Alert Dinamis dengan Fitur Close */}
      {showAlert && hasLowStock && (
        <div
          className={`mb-6 p-4 rounded-2xl border-l-4 flex items-center justify-between no-print transition-all duration-300 ${
            barang.some((b) => b.stok === 0)
              ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500"
              : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500"
          }`}>
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                barang.some((b) => b.stok === 0) ? "bg-red-500 text-white" : "bg-amber-500 text-white"
              }`}>
              <Package size={20} className={barang.some((b) => b.stok === 0) ? "animate-bounce" : ""} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {barang.some((b) => b.stok === 0) ? "Ada Stok yang Habis!" : "Peringatan Stok Tipis"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-red-600 dark:text-red-400">{barang.filter((b) => b.stok === 0).length} Habis</span> &{" "}
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {barang.filter((b) => b.stok > 0 && b.stok < 10).length} Tipis
                </span>{" "}
                Terdeteksi.
              </p>
            </div>
          </div>

          {/* Tombol Close */}
          <button
            onClick={() => setShowAlert(false)}
            className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* FILTER KATEGORI */}
      <div className="flex items-center justify-between h-12 mb-6 gap-4 no-print w-full">
        {/* AREA KIRI: Scrollable Kategori - Akan mengecil jika sedikit, akan scroll jika banyak */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 h-full min-w-0">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 border h-full ${
                selectedCategory === cat.name
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500 border-slate-200 dark:border-slate-700 shadow-sm"
              }`}>
              {cat.name}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100">
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* AREA KANAN: Tombol Aksi (Terkunci & Sejajar) */}
        <div className="flex items-center gap-2 shrink-0 h-full">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-xl shadow-lg transition-all font-bold text-xs h-full active:scale-95 whitespace-nowrap">
            <Printer size={16} />
            Cetak PDF
          </button>

          {currentUser.role === "admin" && (
            <label className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20 transition-all font-bold text-xs h-full active:scale-95 cursor-pointer whitespace-nowrap">
              <Plus size={16} />
              Import Excel
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} />
            </label>
          )}

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition-all font-bold text-xs h-full active:scale-95 whitespace-nowrap">
            <Package size={16} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="mb-4 relative no-print group">
        <Search className="absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
        <input
          type="text"
          value={searchTerm}
          placeholder="Cari nama barang atau kategori..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-500/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all shadow-sm focus:shadow-md"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: FORM SECTION */}
        {currentUser?.role === "admin" && (
          <div className="lg:col-span-1 no-print">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 sticky top-8 transition-colors duration-500">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-700 dark:text-slate-100">
                {isEditing ? <Edit2 size={18} className="mt-1 text-orange-500" /> : <Plus size={18} className="mt-1 text-indigo-500" />}
                {isEditing ? "Ubah Informasi Aset" : "Registrasi Aset Baru"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Input Nama Barang - Diselaraskan */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 block mb-1">Nama Barang</label>
                  <input
                    ref={nameInputRef}
                    autoComplete="off"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 py-2.5 px-4 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    type="text"
                    placeholder="Contoh: MacBook Pro M3"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    required
                  />
                </div>

                {/* Dropdown Kategori - Diselaraskan */}
                <div className="relative">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 block mb-1">Kategori Aset</label>

                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full border py-2.5 px-4 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                      isDropdownOpen
                        ? "border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/20 bg-white dark:bg-slate-800"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600"
                    }`}>
                    <span
                      className={`font-semibold text-base ${form.kategori ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`}>
                      {form.kategori || "-- Pilih Kategori --"}
                    </span>
                    <svg
                      className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${isDropdownOpen ? "rotate-180 text-indigo-500" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Dropdown Menu (Tetap sama) */}
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                      <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="max-h-60 overflow-y-auto p-1">
                          {categories
                            .filter((c) => c.name !== "Semua")
                            .map((cat) => (
                              <div
                                key={cat.name}
                                onClick={() => {
                                  setForm({ ...form, kategori: cat.name });
                                  setIsDropdownOpen(false);
                                }}
                                className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl cursor-pointer transition-colors">
                                {cat.name}
                              </div>
                            ))}
                          <div className="border-t border-slate-50 dark:border-slate-700 mt-1 pt-1">
                            <div
                              onClick={() => {
                                setIsDropdownOpen(false);
                                setForm({ ...form, kategori: "new" });
                              }}
                              className="px-4 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl cursor-pointer transition-all flex items-center gap-2">
                              <Plus size={16} strokeWidth={3} /> Kategori Baru
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Grid Harga & Stok */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 block mb-1">Harga Unit</label>
                    <input
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 py-2.5 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-700 dark:text-indigo-400 transition-all"
                      type="text"
                      placeholder="Rp 0"
                      value={formatRupiah(form.harga)}
                      onChange={(e) => setForm({ ...form, harga: cleanRupiah(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 block mb-1">Stok Barang</label>
                    <div className="relative flex items-center group">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, stok: Math.max(0, Number(form.stok) - 1) })}
                        className="absolute left-1 z-10 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all">
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <input
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 py-2.5 px-10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-center text-slate-800 dark:text-slate-100 transition-all group-hover:border-slate-400 dark:group-hover:border-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.stok}
                        onChange={(e) => setForm({ ...form, stok: Math.max(0, parseInt(e.target.value) || 0) })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, stok: Number(form.stok) + 1 })}
                        className="absolute right-1 z-10 p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all">
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Button Action Tetap Sama */}
                <button
                  className={`w-full py-3 mt-4 rounded-xl font-semibold text-white shadow-lg transition-all transform active:scale-95 ${isEditing ? "bg-orange-500 hover:bg-orange-600" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                  {isEditing ? "Perbarui Aset" : "Daftarkan Barang"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* RIGHT: TABLE SECTION */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
            <table className="w-full text-left table-fixed">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  {currentUser?.role === "admin" && (
                    <th className="p-4 w-16 text-center">
                      <div className="flex justify-center">
                        <CustomCheckbox
                          checked={selectedIds.length === currentItems.length && currentItems.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                  )}

                  <th
                    className="p-4 w-1/3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition group"
                    onClick={() =>
                      setSortConfig({
                        key: "nama_barang",
                        direction: sortConfig.key === "nama_barang" && sortConfig.direction === "asc" ? "desc" : "asc",
                      })
                    }>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Detail Barang</span>
                      <span
                        className={`transition-opacity ${sortConfig.key === "nama_barang" ? "opacity-100 text-indigo-500" : "opacity-0 group-hover:opacity-100 text-slate-400"}`}>
                        {sortConfig.key === "nama_barang" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </div>
                  </th>

                  <th className="p-4 w-32 text-xs font-bold uppercase tracking-wider">Kategori</th>
                  <th
                    className="p-4 w-40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition group"
                    onClick={() =>
                      setSortConfig({
                        key: "harga",
                        direction: sortConfig.key === "harga" && sortConfig.direction === "asc" ? "desc" : "asc",
                      })
                    }>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Harga Unit</span>
                      <span
                        className={`transition-opacity ${sortConfig.key === "harga" ? "opacity-100 text-indigo-500" : "opacity-0 group-hover:opacity-100 text-slate-400"}`}>
                        {sortConfig.key === "harga" ? (sortConfig.direction === "desc" ? "↑" : "↓") : "↕"}
                      </span>
                    </div>
                  </th>
                  <th
                    className="p-4 w-32 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition group text-center"
                    onClick={() =>
                      setSortConfig({
                        key: "stok",
                        direction: sortConfig.key === "stok" && sortConfig.direction === "asc" ? "desc" : "asc",
                      })
                    }>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Stok & Status</span>
                      <span
                        className={`transition-opacity ${sortConfig.key === "stok" ? "opacity-100 text-indigo-500" : "opacity-0 group-hover:opacity-100 text-slate-400"}`}>
                        {sortConfig.key === "stok" ? (sortConfig.direction === "desc" ? "↑" : "↓") : "↕"}
                      </span>
                    </div>
                  </th>
                  {currentUser?.role === "admin" && (
                    <th className="p-4 w-28 text-xs font-bold uppercase tracking-wider text-center">Aksi</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentItems.length > 0 ? (
                  currentItems.map((b, index) => (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`transition-all duration-300 ${selectedIds.includes(b.id) ? "bg-indigo-50/70 dark:bg-indigo-500/10 shadow-inner" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
                      {currentUser?.role === "admin" && (
                        <td className="p-4 w-12 text-center">
                          <div className="flex justify-center">
                            <CustomCheckbox checked={selectedIds.includes(b.id)} onChange={() => toggleSelect(b.id)} />
                          </div>
                        </td>
                      )}
                      <td className="p-4 overflow-hidden">
                        <div className="font-semibold text-base text-slate-800 dark:text-slate-200 truncate" title={b.nama_barang}>
                          {b.nama_barang}
                        </div>
                        <div className="text-xs dark:text-slate-100">REF:#{index + 1}</div>
                      </td>

                      <td className="p-4">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700 uppercase">
                          {b.kategori}
                        </span>
                      </td>

                      <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">{formatRupiah(b.harga)}</td>

                      <td className="p-4 text-center">
                        <div className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none">{b.stok}</div>
                        <div
                          className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${darkMode ? getStockStatus(b.stok).color.replace("bg-", "bg-opacity-20 bg-") : getStockStatus(b.stok).color}`}>
                          {getStockStatus(b.stok).label}
                        </div>
                      </td>

                      <td className="p-4 no-print text-center">
                        {currentUser?.role === "admin" && (
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleEdit(b)}
                              className="p-2 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-500/10 rounded-xl transition">
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleHapus(b.id)}
                              className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-xl transition">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-0 border-none">
                      <TableEmptyState
                        isSearch={searchTerm && searchTerm.length > 0}
                        searchTerm={searchTerm}
                        resetSearch={() => setSearchTerm("")}
                      />
                    </td>
                  </tr>
                )}
                {emptyRows > 0 && currentPage <= totalPages && (
                  <tr style={{ height: `${emptyRows * 64}px` }}>
                    <td colSpan="6" />
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 bg-white dark:dark:bg-slate-800/50 rounded-b-xl border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredBarang.length)} dari {filteredBarang.length} aset
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-slate-800 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 disabled:opacity-50 hover:bg-slate-200">
                  <ChevronLeft size={16} />
                </button>

                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === i + 1
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}>
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-slate-800 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 disabled:opacity-50 hover:bg-slate-200">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Floating Action Bar */}
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ y: 100, opacity: 0, x: "-50%" }} // Mulai dari bawah
                  animate={{ y: 0, opacity: 1, x: "-50%" }} // Naik ke posisi asli
                  exit={{ y: 100, opacity: 0, x: "-50%" }} // Turun saat hilang
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="fixed bottom-10 left-1/2 z-100 w-full max-w-fit">
                  <div className="bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-700/50 px-6 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-8 border-b-indigo-500/50">
                    {/* Info Counter */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40 rotate-3">
                          <span className="text-white font-black text-lg -rotate-3">{selectedIds.length}</span>
                        </div>
                        {/* Efek hiasan titik mungil */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                      </div>

                      <div>
                        <h4 className="text-white font-bold text-sm tracking-wide">Aset Terpilih</h4>
                        <p className="text-slate-400 text-[11px] uppercase tracking-widest font-medium">Bulk Action Mode</p>
                      </div>
                    </div>

                    {/* Garis Pembatas Vertikal */}
                    <div className="h-10 w-px bg-slate-700/50"></div>

                    {/* Action Buttons */}
                    {currentUser?.role === "admin" && selectedIds.length > 0 && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedIds([])}
                          className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-all">
                          Batal
                        </button>

                        <button
                          onClick={handleBulkDelete}
                          className="group flex items-center gap-2 bg-linear-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-red-500/20 transition-all active:scale-95">
                          <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
                          Hapus Permanen
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Container History di bawah tabel */}
          <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden no-print transition-all">
            <div className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 dark:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                  <LayoutDashboard size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Riwayat Aktivitas Sistem</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-[0.2em]">
                    Log Perubahan Data Aset
                  </p>
                </div>
              </div>

              {currentUser?.role === "admin" && history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all border border-red-100 dark:border-red-500/20">
                  Bersihkan Log
                </button>
              )}
            </div>

            <div className="p-8">
              {history.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700">
                    <LayoutDashboard className="text-slate-300 dark:text-slate-600" size={32} />
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                    Belum ada aktivitas terekam
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 relative">
                  {/* Garis tengah vertikal (Hanya muncul di layar desktop) */}
                  <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700 -translate-x-1/2" />

                  {history.map((log) => (
                    <div key={log.id} className="group relative flex gap-4 items-start">
                      {/* Status Dot */}
                      <div
                        className={`mt-1.5 w-3 h-3 rounded-full shrink-0 shadow-sm ${
                          log.aksi === "TAMBAH"
                            ? "bg-emerald-500 shadow-emerald-500/40"
                            : log.aksi === "EDIT"
                              ? "bg-indigo-500 shadow-indigo-500/40"
                              : "bg-red-500 shadow-red-500/40"
                        }`}
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                              log.aksi === "TAMBAH"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : log.aksi === "EDIT"
                                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                  : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}>
                            {log.aksi}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold">
                            {new Date(log.waktu).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" })} •{" "}
                            {new Date(log.waktu).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-bold leading-snug">{log.detail}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">User: {log.user}</span>
                          {currentUser?.role === "admin" && (
                            <button
                              onClick={() => deleteOneHistory(log.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all text-[10px] font-bold uppercase tracking-tighter">
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ManajemenAset;
