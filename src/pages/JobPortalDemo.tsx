import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle2, Loader2, MapPin, Building2, GraduationCap, Mail, User, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface ExtractedData {
  Name: string;
  Email: string;
  Skills: string[];
  Organization: string[];
  Education: string[];
  Location: string;
}

export default function JobPortalDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<ExtractedData | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setData(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    }
  });

  const processResume = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload to get text
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      // 2. Extract entities
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: uploadData.content })
      });
      const extractedData = await extractRes.json();
      setData(extractedData);
    } catch (e) {
      console.error(e);
      alert("Extraction failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Smart Job Application</h1>
          <p className="text-slate-500">Upload your resume to auto-fill your application using our NER model.</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <div {...getRootProps()} className={cn(
            "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
            isDragActive ? "border-indigo-500 bg-indigo-50 scale-[1.02]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
            file && "border-emerald-500 bg-emerald-50"
          )}>
            <input {...getInputProps()} />
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); processResume(); }}
                    disabled={isProcessing}
                    className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Auto-Fill Application
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-medium text-slate-900">Drop your resume here</p>
                  <p className="text-sm text-slate-500 mt-1">Supports PDF or Text files</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Form Section */}
        {data && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
          >
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Application Form</h2>
                <p className="text-slate-400 text-sm">Review the extracted information below.</p>
              </div>
              <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/30">
                AI Extracted
              </div>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" /> Full Name
                  </label>
                  <input 
                    type="text" 
                    defaultValue={data.Name} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" /> Email Address
                  </label>
                  <input 
                    type="email" 
                    defaultValue={data.Email} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> Location
                  </label>
                  <input 
                    type="text" 
                    defaultValue={data.Location} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" /> Work Experience
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {data.Organization?.map((org, i) => (
                      <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-sm">
                        {org}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-400" /> Education
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {data.Education?.map((edu, i) => (
                      <span key={i} className="px-3 py-1 bg-pink-50 text-pink-700 border border-pink-100 rounded-full text-sm">
                        {edu}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-slate-400" /> Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {data.Skills?.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancel</button>
              <button className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800">
                Submit Application
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
