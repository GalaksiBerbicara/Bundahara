import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { UserPlus, User, Lock, ShieldCheck, ArrowRight } from "lucide-react"; // Ikon tambahan

const Register = () => {
  const [formData, setFormData] = useState({ username: "", password: "", role: "staff" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/register", formData);

      // SweetAlert yang lebih estetik mengikuti tema
      Swal.fire({
        icon: "success",
        title: "Registration Success!",
        text: "Akun kamu berhasil dibuat, silakan login.",
        background: "#0f172a",
        color: "#fff",
        confirmButtonColor: "#6366f1",
        customClass: {
          popup: "rounded-[2rem] border border-white/10 backdrop-blur-md",
        },
      });

      navigate("/login");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err.response?.data?.message || "Gagal daftar, coba lagi ya Val!",
        background: "#0f172a",
        color: "#fff",
        confirmButtonColor: "#f43f5e",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] relative overflow-hidden font-sans px-4">
      {/* Dekorasi Background Orbs */}
      <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-600/20 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] bg-indigo-600/20 blur-[100px] rounded-full" />

      <div className="w-full max-w-md z-10">
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-linear-to-trrom-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30 -rotate-3 hover:rotate-0 transition-transform duration-500">
              <UserPlus className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-2">
              Join <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">Bundahara</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium italic">"Mulai kelola asetmu dengan lebih cerdas"</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Username</label>
              <div className="relative group">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  required
                  placeholder="Buat username baru"
                  className="w-full bg-slate-800/40 border border-white/5 p-4 pl-12 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-slate-600"
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Password</label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors"
                  size={18}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-800/40 border border-white/5 p-4 pl-12 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-slate-600"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {/* Input Role */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Access Level</label>
              <div className="relative group">
                <ShieldCheck
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors"
                  size={18}
                />
                <select
                  className="w-full bg-slate-800/40 border border-white/5 p-4 pl-12 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition-all appearance-none cursor-pointer"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="staff" className="bg-slate-900">
                    Staff Operasional
                  </option>
                  <option value="admin" className="bg-slate-900">
                    Administrator
                  </option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group mt-4">
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Link Login */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 font-bold transition-colors underline underline-offset-4 decoration-blue-500/30">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
