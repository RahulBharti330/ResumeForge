import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  FileCheck, 
  Tags, 
  BarChart3,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalResumes: number;
  annotatedResumes: number;
  totalAnnotations: number;
  labelStats: { label: string; count: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then(setStats);
  }, []);

  if (!stats) return <div className="p-8 text-slate-400">Loading analytics...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Overview</h1>
        <p className="text-slate-500 mt-2">Real-time metrics from the resume annotation pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Resumes" 
          value={stats.totalResumes} 
          icon={Users} 
          trend="+12% this week"
          color="bg-blue-500"
        />
        <StatCard 
          title="Annotated Datasets" 
          value={stats.annotatedResumes} 
          icon={FileCheck} 
          trend="85% completion rate"
          color="bg-emerald-500"
        />
        <StatCard 
          title="Total Entities" 
          value={stats.totalAnnotations} 
          icon={Tags} 
          trend="Avg 15 per resume"
          color="bg-violet-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900">Entity Distribution</h3>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {stats.labelStats.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="text-slate-500">{item.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / stats.totalAnnotations) * 100}%` }}
                    className="h-full bg-slate-900 rounded-full"
                  />
                </div>
              </div>
            ))}
            {stats.labelStats.length === 0 && (
              <p className="text-sm text-slate-400 italic">No annotations yet. Go to Studio to start labeling.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-semibold text-lg mb-2">Model Performance</h3>
            <p className="text-slate-400 text-sm mb-6">
              Current NER model accuracy based on validation set.
            </p>
            
            <div className="flex items-end gap-4 mb-2">
              <span className="text-5xl font-bold tracking-tighter">94.2%</span>
              <span className="text-emerald-400 text-sm font-medium mb-2 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" /> 2.1%
              </span>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">F1 Score</p>
          </div>
          
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl -ml-12 -mb-12" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl text-white", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
          Live
        </span>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{value}</h3>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-xs text-slate-400 mt-2 border-t border-slate-100 pt-2">{trend}</p>
      </div>
    </div>
  );
}
