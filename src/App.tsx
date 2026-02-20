/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AnnotationStudio from "./pages/AnnotationStudio";
import JobPortalDemo from "./pages/JobPortalDemo";
import Datasets from "./pages/Datasets";

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/studio" element={<AnnotationStudio />} />
            <Route path="/demo" element={<JobPortalDemo />} />
            <Route path="/datasets" element={<Datasets />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
