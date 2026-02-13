import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

function ThemeToggle({ darkMode, setDarkMode }) {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 transition-colors overflow-hidden">
      <motion.div initial={false} animate={{ y: darkMode ? 40 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
        <Sun size={20} />
      </motion.div>
      <motion.div
        className="absolute top-2"
        initial={false}
        animate={{ y: darkMode ? 0 : -40 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}>
        <Moon size={20} />
      </motion.div>
    </button>
  );
}

export default ThemeToggle;
