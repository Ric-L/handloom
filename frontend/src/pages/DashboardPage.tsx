import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyApplications, getApprovedApplicationSlip } from "../api";
import { generateApprovedApplicationPDF } from "../lib/generateApprovedApplicationPDF";
import { formatDate, statusBadgeColor } from "../lib/utils";
import { Link } from "react-router-dom";
import {
  FileCheck2,
  Clock,
  Building2,
  MapPin,
  User,
  Plus,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Download,
  FileText,
  Edit3,
  Copy,
  Check,
} from "lucide-react";

export default function DashboardPage() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["myApplications"],
    queryFn: getMyApplications,
    staleTime: 5000,
  });

  const handleDownloadPDF = async (appId: string) => {
    try {
      setDownloadError(null);
      setDownloadingId(appId);
      const slipData = await getApprovedApplicationSlip(appId);
      generateApprovedApplicationPDF(slipData);
    } catch (err: any) {
      setDownloadError(
        err.response?.data?.error || "Failed to download approved application PDF. Please try again."
      );
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-24 text-slate-400 space-y-3">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-sm font-medium text-slate-500">Retrieving your submitted applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="font-bold text-sm">Error Loading Applications</h3>
        <p className="text-xs text-rose-600">Please sign in again or check server connectivity.</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Top Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
            Trainee Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            My Submitted Applications
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time verification progress for your artisan skill development admissions
          </p>
        </div>

        <Link
          to="/categories"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-primary-700 hover:bg-primary-800 rounded-xl shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Apply for Another Trade
        </Link>
      </div>

      {/* Applications List */}
      {!data || data.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-3xl">
            📋
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Enrolment Applications Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You haven't submitted any artisan training admission forms yet. Browse our accredited trades and register online.
            </p>
          </div>
          <div>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Browse Accredited Trades
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map(app => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {app.category_code || "TRADE"}
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 leading-snug">
                      {app.category_title || "Artisan Training Programme"}
                    </h2>
                    {app.registration_no && (
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded border border-slate-300">
                        <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Reg ID:</span>
                        <span>{app.registration_no}</span>
                        <button
                          type="button"
                          title="Copy Registration ID"
                          onClick={(e) => copyToClipboard(app.registration_no!, app.id, e)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition cursor-pointer"
                        >
                          {copiedId === app.id ? (
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Submitted on: {formatDate(app.submitted_at)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${statusBadgeColor(
                      app.status
                    )}`}
                  >
                    {app.status === "PENDING"
                      ? "🟡 IN VERIFICATION"
                      : app.status === "APPROVED"
                      ? "🟢 SELECTED FOR ADMISSION"
                      : "🔴 APPLICATION NOT APPROVED"}
                  </span>

                  {app.status === "PENDING" && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 text-xs font-semibold rounded-xl border border-slate-200"
                      title="Application is finalized and locked under official verification."
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                      <span>Finalized &amp; Locked</span>
                    </span>
                  )}

                  {app.status === "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(app.id)}
                      disabled={downloadingId === app.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-700 hover:bg-primary-800 active:translate-y-px text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60"
                      title="Download Official Enrolment Confirmation Slip"
                    >
                      {downloadingId === app.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Enrolment PDF</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Download Error Banner */}
              {downloadError && downloadingId === null && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{downloadError}</span>
                </div>
              )}

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Candidate Name:</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-primary-700" />
                    {app.full_name}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Father / Guardian:</span>
                  <div className="font-semibold text-slate-700">{app.guardian_name}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">District & Social Category:</span>
                  <div className="font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-700" />
                    {app.district_state_pin} ({app.social_category})
                  </div>
                </div>
              </div>

              {/* Status Note or Rejection Remarks */}
              {app.status === "PENDING" && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Your documents and eligibility are currently being vetted by the District Handloom Review Board.
                  </span>
                </div>
              )}

              {app.status === "APPROVED" && (
                <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-blue-950 font-medium">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 border border-blue-200">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-extrabold text-blue-950 text-sm">
                        Admission Sanctioned & Confirmed
                      </p>
                      <p className="text-blue-800 text-[11px] mt-0.5">
                        Congratulations! Your artisan training application has been approved. Download your formal confirmation slip below.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(app.id)}
                    disabled={downloadingId === app.id}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 active:translate-y-px text-white text-xs font-bold rounded-xl shadow-md shadow-blue-900/20 transition shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {downloadingId === app.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Download Enrolment Slip (PDF)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {app.status === "REJECTED" && app.rejection_reason && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  <span className="font-bold block">Admissions Board Feedback:</span>
                  <p className="font-mono text-[11px] leading-relaxed">{app.rejection_reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
