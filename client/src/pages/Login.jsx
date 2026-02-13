import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import { User, Lock, ArrowRight, LogIn } from "lucide-react"; // Tambahkan ikon

const Login = ({ setIsLoggedIn, setCurrentUser }) => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/login", credentials);

      // 1. Simpan data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // 2. Tampilkan Toast Selamat Datang
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: "#0f172a", // Sesuaikan dengan tema gelapmu
        color: "#fff",
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });

      Toast.fire({
        icon: "success",
        // Mengambil nama langsung dari respon server
        title: `Selamat datang, ${res.data.user.nama}!`,
        text: "Berhasil masuk ke sistem.",
      });

      // 3. Update state utama
      setCurrentUser(res.data.user);
      setIsLoggedIn(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Login Gagal",
        text: "Cek username atau password kamu lagi ya, Val!",
        background: "#0f172a",
        color: "#fff",
        confirmButtonColor: "#f43f5e",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] relative overflow-hidden font-sans">
      {/* Dekorasi Background Bulatan Cahaya */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />

      <div className="w-full max-w-md p-1 z-10">
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <LogIn className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-2">
              Welcome <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">Back!</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium">Silahkan login untuk mengelola aset, Val.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Input Username */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Username</label>
              <div className="relative group">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  required
                  placeholder="Masukkan username"
                  className="w-full bg-slate-800/50 border border-white/5 p-4 pl-12 rounded-2xl text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                  size={20}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-white/5 p-4 pl-12 rounded-2xl text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group">
              {loading ? "Menghubungkan..." : "Masuk ke Sistem"}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-slate-500 text-sm">
              Belum punya akun?{" "}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
