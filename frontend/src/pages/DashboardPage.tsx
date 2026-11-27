import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyApplications, getApprovedApplicationSlip } from "../api";
import { generateApprovedApplicationPDF } from "../lib/generateApprovedApplicationPDF";
import { formatDate, statusBadgeColor } from "../lib/utils";
import { Link } from "react-router-dom";
import {
  Clock,
  MapPin,
  User,
  Plus,
  AlertCircle,
  CheckCircle2,
  Download,
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
        err.response?.data?.error || "Could not download the approval letter. Please try again."
      );
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-24 text-slate-500 space-y-3">
        <div className="animate-spin w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-base font-medium">Loading your applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="font-bold text-base">Could Not Load Applications</h3>
        <p className="text-sm text-rose-700">Please sign in again or check your internet connection.</p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalCount = data?.length || 0;
  const pendingCount = data?.filter((a) => a.status === "PENDING").length || 0;
  const approvedCount = data?.filter((a) => a.status === "APPROVED").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Applications
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track your training applications and download your approval letter once selected.
          </p>
        </div>

        <Link
          to="/apply"
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Apply for a New Course
        </Link>
      </div>

      {/* Simple Summary Counters */}
      {totalCount > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <div className="text-2xl font-extrabold text-slate-900">{totalCount}</div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">Total Applied</div>
          </div>
          <div className="bg-white rounded-2xl border border-amber-200 p-4 text-center">
            <div className="text-2xl font-extrabold text-amber-700">{pendingCount}</div>
            <div className="text-xs font-semibold text-amber-800 mt-0.5">Under Review</div>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-200 p-4 text-center">
            <div className="text-2xl font-extrabold text-emerald-700">{approvedCount}</div>
            <div className="text-xs font-semibold text-emerald-800 mt-0.5">Approved</div>
          </div>
        </div>
      )}

      {/* Download Error Banner */}
      {downloadError && downloadingId === null && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Applications List */}
      {!data || data.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto text-3xl">
            📋
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900">No Applications Yet</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              You haven&apos;t applied for any training course yet. Browse our open handloom &amp; craft courses to apply online.
            </p>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition"
          >
            Browse Training Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {app.category_code || "COURSE"}
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {app.category_title || "Artisan Training Course"}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    {app.registration_no && (
                      <span className="inline-flex items-center gap-1.5 font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                        Reg No: {app.registration_no}
                        <button
                          type="button"
                          title="Copy Registration Number"
                          onClick={(e) => copyToClipboard(app.registration_no!, app.id, e)}
                          className="text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          {copiedId === app.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Applied on {formatDate(app.submitted_at)}
                    </span>
                  </div>
                </div>

                <span
                  className={`self-start sm:self-center px-3.5 py-1.5 rounded-full text-xs font-bold ${statusBadgeColor(
                    app.status
                  )}`}
                >
                  {app.status === "PENDING"
                    ? "Under Review"
                    : app.status === "APPROVED"
                    ? "Approved for Training"
                    : "Not Approved"}
                </span>
              </div>

              {/* Visual 3-Step Progress Tracker */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    ✓
                  </span>
                  <span className="text-xs font-semibold text-slate-800">Submitted</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      app.status === "PENDING" ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {app.status === "PENDING" ? "2" : "✓"}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">Document Check</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      app.status === "APPROVED"
                        ? "bg-emerald-600 text-white"
                        : app.status === "REJECTED"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {app.status === "APPROVED" ? "✓" : app.status === "REJECTED" ? "!" : "3"}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {app.status === "REJECTED" ? "Decision" : "Approved"}
                  </span>
                </div>
              </div>

              {/* Applicant Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4 text-blue-700 shrink-0" />
                  <span><strong>{app.full_name}</strong></span>
                </div>
                <div className="text-slate-600">
                  Guardian: <strong className="text-slate-800">{app.guardian_name}</strong>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="truncate">{app.district_state_pin}</span>
                </div>
              </div>

              {/* Status Action / Guidance */}
              {app.status === "PENDING" && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Your application is being reviewed by the department. You do not need to do anything right now.
                  </span>
                </div>
              )}

              {app.status === "APPROVED" && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-950 text-sm">Congratulations! You are selected.</p>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Download and print your official approval letter below.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(app.id)}
                    disabled={downloadingId === app.id}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl shadow-xs transition shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingId === app.id ? "Downloading..." : "Download Approval Letter (PDF)"}</span>
                  </button>
                </div>
              )}

              {app.status === "REJECTED" && app.rejection_reason && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 space-y-1">
                  <span className="font-bold block">Reason for Not Approving:</span>
                  <p>{app.rejection_reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
