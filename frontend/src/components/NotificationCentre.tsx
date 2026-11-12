import React, { useState } from "react";
import {
  Bell,
  FileText,
  Download,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  X,
  FileCheck,
  Megaphone,
} from "lucide-react";
import {
  OFFICIAL_NOTICES,
  PROJECT_UPDATES,
  ProjectNotice,
  ProjectUpdate,
  generateOfficialNoticePDF,
} from "../lib/noticeDocuments";

export const NotificationCentre: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"notices" | "updates">("notices");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<ProjectNotice | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<ProjectUpdate | null>(null);

  const categories = ["ALL", "Admission", "DBT & Finance", "Verification", "Schedule", "Policy"];

  const filteredNotices = OFFICIAL_NOTICES.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredUpdates = PROJECT_UPDATES.filter((item) => {
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDownloadNotice = (notice: ProjectNotice) => {
    setDownloadingId(notice.id);
    try {
      generateOfficialNoticePDF(notice);
    } catch (err) {
      console.error("Failed to generate notice PDF:", err);
    } finally {
      setTimeout(() => setDownloadingId(null), 600);
    }
  };

  return (
    <section id="notification-centre" className="scroll-mt-20 py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-3">
              <Megaphone className="w-3.5 h-3.5 text-blue-600" />
              Information Dissemination Portal
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Project Notification & Announcement Centre
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Official circulars, administrative gazette notices, DBT directives, and real-time field announcements issued by the Directorate of Handloom & Skilled Artisan Development.
            </p>
          </div>

          {/* Quick Counter Badges */}
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-semibold text-slate-600">Gazette Circulars:</span>
              <span className="text-xs font-bold text-blue-900">{OFFICIAL_NOTICES.length} Issued</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-700" />
              <span className="text-xs font-semibold text-slate-600">Field Updates:</span>
              <span className="text-xs font-bold text-sky-900">{PROJECT_UPDATES.length} Live</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          {/* Main Tabs */}
          <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 max-w-md w-full">
            <button
              onClick={() => setActiveTab("notices")}
              className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-5 rounded-xl font-bold text-sm transition-all duration-200 ${
                activeTab === "notices"
                  ? "bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white shadow-md shadow-blue-900/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Official Notices</span>
              <span
                className={`ml-1 text-xs px-2 py-0.5 rounded-full font-extrabold ${
                  activeTab === "notices" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
                }`}
              >
                {OFFICIAL_NOTICES.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("updates")}
              className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-5 rounded-xl font-bold text-sm transition-all duration-200 ${
                activeTab === "updates"
                  ? "bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white shadow-md shadow-blue-900/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Project Updates & News</span>
              <span
                className={`ml-1 text-xs px-2 py-0.5 rounded-full font-extrabold ${
                  activeTab === "updates" ? "bg-white/20 text-white" : "bg-sky-100 text-sky-800"
                }`}
              >
                {PROJECT_UPDATES.length}
              </span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "notices" ? "Search notice title, ref code, or keyword..." : "Search project updates & news..."}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-800 placeholder-slate-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Notices View */}
        {activeTab === "notices" && (
          <div>
            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                Filter Trade Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition shrink-0 ${
                    selectedCategory === cat
                      ? "bg-blue-800 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Notices List */}
            {filteredNotices.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No official notices match your search or category filter.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("ALL");
                  }}
                  className="mt-3 text-xs text-blue-700 font-bold hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {notice.refNo}
                        </span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {notice.category}
                        </span>
                        {notice.isNew && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                            <Sparkles className="w-3 h-3" /> NEW
                          </span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto md:ml-2">
                          <Calendar className="w-3 h-3" /> {notice.date}
                        </span>
                      </div>

                      <h3
                        onClick={() => setSelectedNotice(notice)}
                        className="text-base font-bold text-slate-900 group-hover:text-blue-700 cursor-pointer transition-colors leading-snug"
                      >
                        {notice.title}
                      </h3>

                      <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">{notice.summary}</p>

                      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">Issued by: {notice.signedBy}</span>
                        <span>•</span>
                        <span>Gazette Document Size: {notice.fileSize}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <button
                        onClick={() => setSelectedNotice(notice)}
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-xl transition flex items-center gap-1.5"
                      >
                        <span>View Summary</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDownloadNotice(notice)}
                        disabled={downloadingId === notice.id}
                        className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-2 disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadingId === notice.id ? "Generating PDF..." : "Download Notice (PDF)"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Updates View */}
        {activeTab === "updates" && (
          <div>
            {filteredUpdates.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No project updates match your search term.</p>
                <button onClick={() => setSearchQuery("")} className="mt-3 text-xs text-blue-700 font-bold hover:underline">
                  Show all updates
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5 transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                          {update.tag}
                        </span>
                        {update.isHot && (
                          <span className="text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> LATEST
                          </span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {update.date}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 hover:text-blue-700 transition">
                        {update.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">{update.content}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium text-[11px] truncate max-w-[170px]">{update.author}</span>
                      <button
                        onClick={() => setSelectedUpdate(update)}
                        className="text-blue-700 font-bold hover:text-blue-900 flex items-center gap-1 text-xs shrink-0"
                      >
                        Read Full Story <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notice Detail Modal */}
        {selectedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 rounded-t-3xl relative">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Official Gazette Circular
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold pr-8 leading-snug">{selectedNotice.title}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-blue-200">
                  <span className="font-mono bg-blue-950/60 px-2 py-0.5 rounded text-white font-bold">{selectedNotice.refNo}</span>
                  <span>•</span>
                  <span>Date: {selectedNotice.date}</span>
                  <span>•</span>
                  <span>Classification: {selectedNotice.category}</span>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 text-sm text-slate-700">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-blue-700" /> Executive Directive Summary
                  </h4>
                  <p className="text-xs leading-relaxed text-blue-950 font-medium">{selectedNotice.summary}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Administrative Context & Mandate</h4>
                  <p className="text-xs leading-relaxed text-slate-600">
                    This official notification has been promulgated in accordance with the National Handloom Skill Development Framework and the Ministry of Textiles guidelines. All accredited training centers, district admission committees, and prospective artisan trainees are mandated to comply with the stipulations detailed in the official PDF circular.
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                  <div>
                    <span className="font-bold text-slate-800">Competent Authority:</span>
                    <p className="text-[11px] text-slate-600">{selectedNotice.signedBy}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">Gazette Size:</span>
                    <p className="text-[11px] text-slate-600">{selectedNotice.fileSize} (Authentic Vector PDF)</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 rounded-b-3xl border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadNotice(selectedNotice)}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 rounded-xl shadow flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official PDF Circular</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Detail Modal */}
        {selectedUpdate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 relative">
              <button
                onClick={() => setSelectedUpdate(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-800 uppercase tracking-wide">
                  {selectedUpdate.tag}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {selectedUpdate.date}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-4 pr-6">{selectedUpdate.title}</h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed mb-5">
                {selectedUpdate.content}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200">
                <span className="font-semibold text-slate-700">Disseminated by: {selectedUpdate.author}</span>
                <button
                  onClick={() => setSelectedUpdate(null)}
                  className="px-4 py-2 bg-blue-700 text-white font-bold rounded-xl text-xs hover:bg-blue-800 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
