import { useEffect, useState } from "react";
import { Package, AlertTriangle, DollarSign, BarChart3, PieChart as PieIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { motion } from "framer-motion";


function Dashboard({ barang, formatRupiah, darkMode }) {
  // --- LOGIKA DATA ---
  const [isMounted, setIsMounted] = useState(false);
  const totalJenis = barang.length;
  const totalNilai = barang.reduce((acc, curr) => acc + Number(curr.harga) * Number(curr.stok), 0);
  const stokKritis = barang.filter((b) => b.stok > 0 && b.stok < 10).length;
  const stokHabis = barang.filter((b) => b.stok === 0).length;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Data untuk Grafik Bar (Stok per Kategori)
  const dataKategori = Array.from(new Set(barang.map((b) => b.kategori))).map((kat) => ({
    name: kat,
    stok: barang.filter((b) => b.kategori === kat).reduce((acc, curr) => acc + Number(curr.stok), 0),
  }));

  // Data untuk Donut Chart (Total Rupiah per Kategori)
  const dataNilaiKategori = Array.from(new Set(barang.map((b) => b.kategori))).map((kat) => ({
    name: kat,
    value: barang.filter((b) => b.kategori === kat).reduce((acc, curr) => acc + Number(curr.harga) * Number(curr.stok), 0),
  }));

  // Warna-warni untuk grafik
  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const totalMasalah = stokKritis + stokHabis;
  const statusSistem = totalMasalah > 0 ? "PERLU TINDAKAN" : "STABIL";
  const warnaStatus = totalMasalah > 0 ? "bg-amber-500 shadow-[0_0_12px_#f59e0b]" : "bg-emerald-500 shadow-[0_0_12px_#10b981]";

  const DashboardEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-100 text-center p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="relative mb-8">
        {/* Efek Cahaya di Belakang Ikon */}
        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
        <div className="relative w-24 h-24 bg-linear-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 rotate-6">
          <BarChart3 size={48} className="text-white -rotate-6" />
        </div>
        {/* Ikon Dekoratif Kecil */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute -top-4 -right-4 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 -rotate-12">
          <Package size={20} className="text-white" />
        </motion.div>
      </div>

      <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3">Dashboard Masih Hening</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-8">
        Val, analitik belum bisa ditampilkan karena belum ada aset yang terdaftar. Yuk, isi inventaris kamu dulu!
      </p>

      <div className="flex gap-4">
        <div className="px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
          Menunggu Data Masuk...
        </div>
      </div>
    </motion.div>
  );

  // Jangan render grafik kalau barang masih kosong
  if (!barang || barang.length === 0) {
    return (
      <div className="max-w-6xl mx-auto py-20 px-4">
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto pb-10">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">Dashboard Analitik</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Ringkasan visual seluruh aset inventaris Anda.</p>
      </div>

      <hr className="mb-6 border-slate-200 dark:border-slate-500" />

      {/* Grid Kartu Statistik Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Card Total Jenis - Border Indigo */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all border-b-4 border-b-indigo-500 dark:border-b-indigo-600">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
            <Package size={24} />
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Jenis</p>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{totalJenis}</h2>
        </div>

        {/* Card Nilai Aset */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all border-b-4 border-b-emerald-500 dark:border-b-emerald-600">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
            <DollarSign size={24} />
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nilai Aset</p>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{formatRupiah(totalNilai)}</h2>
        </div>

        {/* Card Stok Kritis */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all border-b-4 border-b-amber-400 dark:border-b-amber-600">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle size={24} />
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Stok Kritis</p>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stokKritis}</h2>
        </div>

        {/* Card Barang Habis */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all border-b-4 border-b-red-500 dark:border-b-red-600">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-4">
            <BarChart3 size={24} className="rotate-90" />
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Barang Habis</p>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stokHabis}</h2>
        </div>
      </div>

      {/* BAGIAN GRAFIK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Grafik Batang: Stok per Kategori */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 transition-all duration-500 min-w-0">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-500 dark:text-indigo-400" /> Sebaran Stok per Kategori
            </h3>
          </div>
          <div className="w-full h-80" style={{ minWidth: 0 }}>
            {isMounted && dataKategori.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataKategori}>
                  {/* Stroke grid disesuaikan agar tidak terlalu terang di dark mode */}
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: darkMode ? "#cbd5e1" : "#64748b",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: darkMode ? "#64748b" : "#94a3b8", fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: darkMode ? "rgba(30, 41, 59, 0.5)" : "#f8fafc" }}
                    contentStyle={{
                      backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                      borderRadius: "12px",
                      border: "none",
                      color: darkMode ? "#f1f5f9" : "#1e293b",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                    }}
                    labelStyle={{ color: darkMode ? "#94a3b8" : "#64748b", fontWeight: "bold" }}
                    itemStyle={{ color: darkMode ? "#6366f1" : "#4f46e5" }}
                  />
                  <Bar dataKey="stok" radius={[8, 8, 0, 0]} barSize={40}>
                    {dataKategori.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={darkMode ? 0.8 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : isMounted ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                Belum ada data untuk ditampilkan
              </div>
            ) : null}
          </div>
        </div>
        {/* Informasi Ringkas */}
        <div className="relative group min-h-112.5 overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-2xl border border-white/5 transition-all duration-700">
          {/* Dekorasi Background Tetap Sama */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full group-hover:bg-indigo-600/30 transition-all duration-700" />
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rotate-12 rounded-3xl blur-sm group-hover:rotate-45 transition-transform duration-2000" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="w-16 h-16 bg-white/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-xl border border-white/20 shadow-xl text-indigo-300">
                <PieIcon size={32} />
              </div>

              {/* Badge Status Live */}
              <div
                className={`px-4 py-1.5 rounded-full border backdrop-blur-md transition-colors duration-500 ${
                  totalMasalah > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30"
                }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${totalMasalah > 0 ? "bg-amber-400" : "bg-emerald-400"}`} />
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.2em] ${totalMasalah > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                    {totalMasalah > 0 ? "Attention Required" : "System Healthy"}
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-black mb-6 leading-tight tracking-tight">
              <span className="opacity-50 font-light">"</span>
              Data adalah kunci <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-300 to-purple-400">Efisiensi Operasional</span>
              <span className="opacity-50 font-light">"</span>
            </h3>

            {/* Pesan Dinamis Berdasarkan Data */}
            <div
              className={`p-5 rounded-3xl backdrop-blur-md border transition-all duration-500 ${
                totalMasalah > 0 ? "bg-amber-500/5 border-amber-500/20" : "bg-white/5 border-white/10"
              }`}>
              <p className="text-slate-300 text-sm leading-relaxed">
                {totalMasalah > 0 ? (
                  <>
                    Val, ada{" "}
                    <span className="text-amber-300 font-bold underline decoration-amber-500 underline-offset-4">{totalMasalah} item</span>{" "}
                    yang butuh perhatian segera untuk menghindari kekosongan stok.
                  </>
                ) : (
                  <>
                    Selamat Val! Semua stok kamu dalam kondisi <span className="text-emerald-400 font-bold">aman dan mencukupi</span> untuk
                    operasional saat ini.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Section Status Nyata di Bawah */}
          <div className="relative z-10 grid grid-cols-2 gap-4 mt-3">
            <div className="p-4 bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Status Inventaris</p>
              <div className="flex items-center gap-3 leading-none">
                <div className={`w-2.5 h-2.5 rounded-full aspect-square    animate-pulse ${warnaStatus}`} />
                {/* Teks Status */}
                <span className={`text-xs font-semibold tracking-wider ${totalMasalah > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {statusSistem}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Total Entri</p>
              <span className="text-xs font-bold">{barang.length} Kategori Aset</span>
            </div>
          </div>
        </div>
        );
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart: Proporsi Nilai Investasi */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors duration-500">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <PieIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                Proporsi Investasi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Distribusi nilai aset berdasarkan kategori</p>
            </div>
          </div>

          <div className="h-80 relative">
            {/* Label Tengah Donut: Adaptif Dark Mode */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Nilai</span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-100 transition-colors">
                {formatRupiah(totalNilai).split(",")[0]}
              </span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataNilaiKategori} innerRadius={85} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                  {dataNilaiKategori.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      // Efek opacity saat dark mode agar lebih nyaman di mata
                      fillOpacity={darkMode ? 0.8 : 1}
                      className="hover:opacity-70 transition-opacity cursor-pointer outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatRupiah(value)}
                  contentStyle={{
                    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                    borderRadius: "16px",
                    border: darkMode ? "1px solid #334155" : "none",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                    padding: "12px",
                  }}
                  // Warna teks di dalam tooltip
                  itemStyle={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: darkMode ? "#f1f5f9" : "#1e293b",
                  }}
                  labelStyle={{ display: "none" }} // Sembunyikan label kategori di tooltip jika perlu
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Insight Box: Estetik & Dark Mode Optimized */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative group overflow-hidden rounded-[2.5rem] transition-all duration-500">
          {/* Gradasi yang lebih dalam untuk dark mode */}
          <div
            className={`absolute inset-0 transition-all duration-700 ${
              darkMode
                ? "bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900"
                : "bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-800"
            } group-hover:scale-105`}
          />

          {/* Efek Glow Dekoratif */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-400/5 rounded-full blur-3xl" />

          <div className="relative p-10 h-full flex flex-col justify-between text-white">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-slate-800/40 backdrop-blur-md rounded-full border border-white/20 dark:border-slate-700/50 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-100 dark:text-indigo-300">Insight Cepat</span>
              </div>

              <h3 className="text-3xl font-black leading-tight mb-4">
                Dominasi Aset pada <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-300 to-indigo-200 dark:from-emerald-400 dark:to-indigo-300">
                  {dataNilaiKategori.sort((a, b) => b.value - a.value)[0]?.name || "Kategori"}
                </span>
              </h3>

              <p className="text-indigo-100/80 dark:text-slate-400 text-sm leading-relaxed max-w-sm mb-8">
                Val, kategori ini memegang porsi terbesar dari modal Anda. Pastikan sistem keamanan dan asuransi untuk aset ini dalam
                kondisi aktif.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xs rounded-3xl border border-white/10 dark:border-slate-800 group-hover:bg-white/10 dark:group-hover:bg-slate-800/60 transition-colors">
                <p className="text-xs italic text-indigo-100 dark:text-slate-300 leading-relaxed">
                  "Fokus pada barang bernilai tinggi (high-value assets) dapat menekan potensi kerugian finansial hingga 20% pertahun."
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="h-px w-8 bg-indigo-300/30 dark:bg-slate-700"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 dark:text-slate-500">
                    Saran Manajemen
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
