import { 
  LayoutDashboard, 
  PenTool, 
  Briefcase, 
  FileText, 
  Settings,
  Upload,
  CheckCircle2,
  Database
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: PenTool, label: "Annotation Studio", href: "/studio" },
  { icon: Database, label: "Datasets", href: "/datasets" },
  { icon: Briefcase, label: "Job Portal Demo", href: "/demo" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white font-bold text-xl">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          ResumeForge
        </div>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">NLP Platform</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-400" : "text-slate-400")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-500">System Online</span>
          </div>
          <p className="text-xs text-slate-500">v1.0.0 • Dev Build</p>
        </div>
      </div>
    </div>
  );
}
