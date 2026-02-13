import { LayoutDashboard, Package, Home, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

function Sidebar({ darkMode, setDarkMode, setIsLoggedIn, onLogout }) {
  return (
    <aside className="w-64 bg-indigo-900 dark:bg-slate-900 text-white hidden md:flex flex-col shadow-xl transition-colors duration-300 border-r border-indigo-900 dark:border-slate-800">
      <div className="p-6 flex items-center gap-3 border-b border-indigo-800 dark:border-indigo-900">
        <div className="p-2 bg-indigo-500 rounded-lg">
          <LayoutDashboard size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">BUNDAHARA</span>
      </div>

      <nav className="p-4 space-y-2 flex-1">
        {/* Navigasi ke Dashboard */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive ? "bg-indigo-600 shadow-lg" : "hover:bg-indigo-800 text-indigo-200"
            }`
          }>
          <Home size={20} />
          <span className="font-semibold text-sm">Dashboard</span>
        </NavLink>

        {/* Navigasi ke Manajemen Aset */}
        <NavLink
          to="/aset"
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive ? "bg-indigo-600 shadow-lg" : "hover:bg-indigo-800 text-indigo-200"
            }`
          }>
          <Package size={20} />
          <span className="font-semibold text-sm">Manajemen Aset</span>
        </NavLink>
      </nav>

      {/* BAGIAN BAWAH (THEME & LOGOUT) */}
      <div className="p-4 space-y-3 border-t border-white/5 dark:border-slate-800/50 bg-black/5 backdrop-blur-md">
        {/* Tombol Tema */}
        <div
          onClick={() => setDarkMode(!darkMode)}
          className="group p-3 flex items-center justify-between bg-white/5 dark:bg-slate-800/40 border border-white/10 dark:border-slate-700/30 rounded-2xl transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/5 cursor-pointer active:scale-[0.97] select-none">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-indigo-300/50 dark:text-slate-500 font-bold">App Theme</span>
            <span className="text-sm font-semibold text-slate-200 dark:text-slate-300">{darkMode ? "Dark Mode" : "Light Mode"}</span>
          </div>
          <div className="p-1.5 bg-white/5 dark:bg-slate-900/50 rounded-xl group-hover:bg-indigo-500/10 transition-colors">
            <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          </div>
        </div>

        {/* Tombol Logout (Estetik & Selaras) */}
        <button
          onClick={onLogout}
          className="w-full group p-3 flex items-center justify-between rounded-2xl bg-white/5 dark:bg-slate-800/40 border border-white/10 dark:border-slate-700/30 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300 active:scale-[0.97]">
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] uppercase tracking-widest text-red-400/50 font-bold">Account Session</span>
            <span className="text-sm font-bold text-slate-200 dark:text-slate-300 group-hover:text-red-400 transition-colors">
              Logout Account
            </span>
          </div>
          <div className="p-2 bg-red-500/5 dark:bg-red-500/10 rounded-xl text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-red-500/0 group-hover:shadow-red-500/20">
            <LogOut size={18} />
          </div>
        </button>

        {/* Info Versi */}
        <div className="pt-2 opacity-40 hover:opacity-100 transition-opacity duration-500">
          <p className="text-[9px] text-indigo-400 dark:text-slate-600 text-center uppercase tracking-[0.3em] font-mono font-bold">
            v1.0 • Built By Val
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
