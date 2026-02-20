import { useState, useEffect } from "react";
import { Database, Download, Trash2, Search } from "lucide-react";

interface Resume {
  id: string;
  filename: string;
  upload_date: string;
  status: string;
}

export default function Datasets() {
  const [resumes, setResumes] = useState<Resume[]>([]);

  useEffect(() => {
    fetch("/api/resumes")
      .then(res => res.json())
      .then(setResumes);
  }, []);

  const handleExport = () => {
    window.location.href = "/api/export";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Datasets</h1>
          <p className="text-slate-500 mt-2">Manage your annotated resume collections.</p>
        </div>
        <button 
          onClick={handleExport}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <Download className="w-4 h-4" /> Export JSONL
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search datasets..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Filename</th>
              <th className="px-6 py-4">Upload Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resumes.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  {r.filename}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(r.upload_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    r.status === 'annotated' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
