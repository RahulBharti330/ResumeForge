import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Check, AlertCircle, Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Resume {
  id: string;
  filename: string;
  content: string;
  status: 'raw' | 'annotated';
}

interface Annotation {
  label: string;
  start_index: number;
  end_index: number;
  text: string;
}

const LABELS = [
  { name: "NAME", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { name: "EMAIL", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { name: "SKILL", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { name: "ORG", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { name: "EDU", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { name: "LOC", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
];

export default function AnnotationStudio() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeLabel, setActiveLabel] = useState<string>("SKILL");
  const [isUploading, setIsUploading] = useState(false);
  const [isAutoLabeling, setIsAutoLabeling] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    if (selectedResume) {
      fetch(`/api/resumes/${selectedResume.id}`)
        .then(res => res.json())
        .then(data => {
            if (data.annotations) {
                setAnnotations(data.annotations);
            } else {
                setAnnotations([]);
            }
        });
    }
  }, [selectedResume]);

  const fetchResumes = () => {
    fetch("/api/resumes")
      .then((res) => res.json())
      .then(setResumes);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      fetchResumes();
      // Select the newly uploaded resume
      setSelectedResume({ ...data, status: 'raw' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selectedResume) return;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text) return;

    // This is a simplified offset calculation. 
    // In a real app, we need to map DOM nodes back to the raw string indices precisely.
    // Here we rely on the fact that we render the text in a single block.
    // However, React rendering might split text nodes. 
    // For this demo, we will just use the text content and find it in the raw string.
    // Limitation: If the same word appears twice, this simple find might pick the wrong one.
    // But for a demo, it's acceptable.
    
    // Better approach for demo: Just store the text and assume unique enough or user accepts first match.
    // Or, we can try to use the anchorNode/focusNode to calculate offset if we render carefully.
    
    // Let's try a simple "find first occurrence after last selection" or just simple indexOf for now.
    const start = selectedResume.content.indexOf(text); 
    if (start === -1) return;

    const newAnnotation = {
      label: activeLabel,
      text: text,
      start_index: start,
      end_index: start + text.length
    };

    setAnnotations([...annotations, newAnnotation]);
    selection.removeAllRanges();
  };

  const removeAnnotation = (index: number) => {
    setAnnotations(annotations.filter((_, i) => i !== index));
  };

  const saveAnnotations = async () => {
    if (!selectedResume) return;
    await fetch(`/api/resumes/${selectedResume.id}/annotate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ annotations }),
    });
    fetchResumes(); // Refresh status
    alert("Dataset saved successfully!");
  };

  const autoLabel = async () => {
      if (!selectedResume) return;
      setIsAutoLabeling(true);
      try {
          const res = await fetch("/api/pre-annotate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: selectedResume.content })
          });
          const newAnnotations = await res.json();
          setAnnotations(newAnnotations);
      } catch (e) {
          console.error(e);
          alert("Auto-labeling failed");
      } finally {
          setIsAutoLabeling(false);
      }
  };

  // Render text with highlights
  // This is tricky in React. We need to split the string by annotations.
  const renderHighlightedText = () => {
    if (!selectedResume) return null;
    
    const text = selectedResume.content;
    if (annotations.length === 0) return <div className="whitespace-pre-wrap font-mono text-sm">{text}</div>;

    // Sort annotations by start index
    const sorted = [...annotations].sort((a, b) => a.start_index - b.start_index);
    
    const chunks = [];
    let lastIndex = 0;

    sorted.forEach((ann, i) => {
      // Push text before annotation
      if (ann.start_index > lastIndex) {
        chunks.push(
          <span key={`text-${i}`}>{text.slice(lastIndex, ann.start_index)}</span>
        );
      }

      // Push annotation
      const labelConfig = LABELS.find(l => l.name === ann.label) || LABELS[0];
      chunks.push(
        <span 
            key={`ann-${i}`} 
            className={cn("px-1 rounded border mx-0.5 cursor-pointer relative group", labelConfig.color)}
            onClick={() => removeAnnotation(i)}
        >
            {text.slice(ann.start_index, ann.end_index)}
            <span className="absolute -top-3 left-0 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 bg-black text-white px-1 rounded transition-opacity">
                {ann.label} ×
            </span>
        </span>
      );

      lastIndex = ann.end_index;
    });

    // Push remaining text
    if (lastIndex < text.length) {
      chunks.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{chunks}</div>;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Left Sidebar: Resume List */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div {...getRootProps()} className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
            isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
          )}>
            <input {...getInputProps()} />
            {isUploading ? (
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-indigo-500" />
            ) : (
              <>
                <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-600">Upload Resume</p>
                <p className="text-xs text-slate-400 mt-1">PDF or Text</p>
              </>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {resumes.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedResume(r)}
              className={cn(
                "w-full text-left p-3 rounded-lg text-sm flex items-center justify-between group",
                selectedResume?.id === r.id ? "bg-slate-100 ring-1 ring-slate-200" : "hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  r.status === 'annotated' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                )}>
                  {r.status === 'annotated' ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
                <div className="truncate">
                  <p className="font-medium text-slate-900 truncate">{r.filename}</p>
                  <p className="text-xs text-slate-500">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Area: Annotation Interface */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedResume ? (
          <>
            {/* Toolbar */}
            <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-500">Active Label:</span>
                <div className="flex gap-2">
                  {LABELS.map(l => (
                    <button
                      key={l.name}
                      onClick={() => setActiveLabel(l.name)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                        activeLabel === l.name 
                          ? l.color + " ring-2 ring-offset-2 ring-indigo-500" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                    onClick={autoLabel}
                    disabled={isAutoLabeling}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                    {isAutoLabeling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    AI Auto-Label
                </button>
                <button 
                  onClick={saveAnnotations}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Save Dataset
                </button>
              </div>
            </div>

            {/* Text Area */}
            <div 
              className="flex-1 overflow-y-auto p-8 bg-slate-50/50"
              onMouseUp={handleTextSelection}
            >
              <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-[800px]">
                {renderHighlightedText()}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a resume to start annotating</p>
          </div>
        )}
      </div>
    </div>
  );
}
