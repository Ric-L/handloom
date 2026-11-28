import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyApplications, getApprovedApplicationSlip, getCurrentUser } from "../api";
import { generateApprovedApplicationPDF } from "../lib/generateApprovedApplicationPDF";
import { formatDate, statusBadgeColor } from "../lib/utils";
import { Link, useSearchParams } from "react-router-dom";
import CandidateWorkspaceShell from "../components/CandidateWorkspaceShell";
import CandidateProfileCard from "../components/CandidateProfileCard";
import type { User } from "../types";
import {
  FileText,
  AlertCircle,
  Download,
  Eye,
  RotateCcw,
  Copy,
  Check,
  ArrowRight,
  BookOpen,
  UserCircle2,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const isProfileTab = searchParams.get("tab") === "profile";

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        if (res?.user) {
          setProfileUser(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
        }
      })
      .catch(() => {
        // Keep cached user profile if network fails
      });
  }, []);

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

  const totalCount = data?.length || 0;
  const pendingCount = data?.filter((a) => a.status === "PENDING").length || 0;
  const approvedCount = data?.filter((a) => a.status === "APPROVED").length || 0;
  const activeCategoryIds = new Set(
    (data || [])
      .filter((a) => a.status === "PENDING" || a.status === "APPROVED")
      .map((a) => a.category_id)
  );

  if (isProfileTab) {
    return (
      <CandidateWorkspaceShell
        title="Welcome to your portal"
        subtitle="View and edit your registered applicant and permanent Manipur address details."
      >
        <CandidateProfileCard
          user={profileUser}
          onUpdated={(updatedUser) => {
            setProfileUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }}
        />
      </CandidateWorkspaceShell>
    );
  }

  return (
    <CandidateWorkspaceShell
      title="Welcome to your portal"
      subtitle="Manage your skill training applications and download approved admission slips."
    >
      <div className="bg-white border border-[#D9C5A3] rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5C6B45] block">
              DASHBOARD
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#3B3028]">
              Your next step starts here
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E5D50] bg-[#FAF6EE] px-3 py-1 rounded-full border border-[#D9C5A3] self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5C6B45]" />
            {totalCount} {totalCount === 1 ? "saved application" : "saved applications"}
          </span>
        </div>

        {/* 3 KPI Stat Cards (matching Reference Dashboard Screenshot 6) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[#D9C5A3] bg-[#FAF6EE]/60 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#EEF2E7] text-[#5C6B45] flex items-center justify-center border border-[#5C6B45]/20">
              <FileText className="w-4 h-4" />
            </div>
            <div className="font-serif text-2xl text-[#3B3028]">
              {String(totalCount).padStart(2, "0")}
            </div>
            <div className="text-xs text-[#6E5D50]">Submitted applications</div>
          </div>

          <div className="p-4 rounded-xl border border-[#D9C5A3] bg-[#FAF6EE]/60 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#F3EAE2] text-[#8B5E3C] flex items-center justify-center border border-[#8B5E3C]/20">
              <Clock className="w-4 h-4" />
            </div>
            <div className="font-serif text-2xl text-[#8B5E3C]">
              {String(pendingCount).padStart(2, "0")}
            </div>
            <div className="text-xs text-[#6E5D50]">Under review</div>
          </div>

          <div className="p-4 rounded-xl border border-[#D9C5A3] bg-[#FAF6EE]/60 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#EEF2E7] text-[#5C6B45] flex items-center justify-center border border-[#5C6B45]/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="font-serif text-2xl text-[#5C6B45]">
              {String(approvedCount).padStart(2, "0")}
            </div>
            <div className="text-xs text-[#6E5D50]">Approved admissions</div>
          </div>
        </div>

        {/* Primary Application CTA Card (matching Screenshot 6) */}
        <div className="rounded-xl border border-[#5C6B45]/30 bg-[#EEF2E7] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-white text-[#5C6B45] flex items-center justify-center border border-[#5C6B45]/25 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5C6B45] block">
                APPLICATION FORM
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-[#3B3028] mt-0.5">
                Start a new application
              </h3>
              <p className="text-xs sm:text-sm text-[#6E5D50] mt-0.5">
                Choose a training trade, verify your details, and upload mandatory documents below 5 MB.
              </p>
            </div>
          </div>

          <Link
            to="/apply"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] font-semibold text-sm rounded-lg shadow-xs transition shrink-0"
          >
            <span>Start application</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Quick Links Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/categories"
            className="p-4 rounded-xl border border-[#D9C5A3] bg-white hover:bg-[#FAF6EE] transition flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FAF6EE] border border-[#D9C5A3] text-[#8B5E3C] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#3B3028]">Browse training trades</div>
                <div className="text-xs text-[#6E5D50]">Inspect open courses &amp; NSQF norms</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8B5E3C]" />
          </Link>

          <Link
            to="/dashboard?tab=profile"
            className="p-4 rounded-xl border border-[#D9C5A3] bg-white hover:bg-[#FAF6EE] transition flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FAF6EE] border border-[#D9C5A3] text-[#5C6B45] flex items-center justify-center">
                <UserCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#3B3028]">Profile details</div>
                <div className="text-xs text-[#6E5D50]">View &amp; edit registered details &amp; address</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#5C6B45]" />
          </Link>
        </div>

        {/* Download Error */}
        {downloadError && downloadingId === null && (
          <div className="p-4 bg-[#FDF2EE] border border-[#8B5E3C]/50 rounded-xl text-sm text-[#632919] flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#8B5E3C] shrink-0" />
            <span>{downloadError}</span>
          </div>
        )}

        {/* Loading / Error / Applications List */}
        {isLoading ? (
          <div className="text-center py-12 text-[#6E5D50] space-y-3">
            <div className="animate-spin w-8 h-8 border-4 border-[#8B5E3C] border-t-transparent rounded-full mx-auto" />
            <p className="text-sm font-medium">Loading your applications...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-[#FDF2EE] border border-[#8B5E3C]/50 rounded-xl text-[#632919] text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#8B5E3C] mx-auto" />
            <h3 className="font-serif text-lg">Could Not Load Applications</h3>
            <p className="text-xs">Please sign in again or check your connection.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-[#8B5E3C] text-[#F5EFE3] text-xs font-semibold rounded-lg hover:bg-[#734C30] transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#FAF6EE] border border-[#D9C5A3] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-[#3B3028]">No applications submitted yet</div>
              <p className="text-xs text-[#6E5D50] leading-relaxed">
                Click &ldquo;Start application&rdquo; above to choose a training trade and upload your required documents.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2 border-t border-[#E9DEC8]">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C6B45]">
              MY SUBMITTED APPLICATIONS
            </h3>

            {data.map((app) => (
              <div
                key={app.id}
                className="bg-[#FAF6EE] rounded-xl border border-[#D9C5A3] p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D9C5A3]">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#8B5E3C] bg-white px-2.5 py-0.5 rounded-md border border-[#D9C5A3]">
                        {app.category_code || "COURSE"}
                      </span>
                      <span className={`px-3 py-0.5 rounded-full text-xs ${statusBadgeColor(app.status)}`}>
                        {app.status === "PENDING"
                          ? "Under Review"
                          : app.status === "APPROVED"
                          ? "Approved"
                          : "Rejected"}
                      </span>
                    </div>
                    <h4 className="font-serif text-xl text-[#3B3028]">
                      {app.category_title || "Artisan Skill Training"}
                    </h4>
                  </div>

                  {app.registration_no && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-[#D9C5A3] shrink-0">
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-[#6E5D50] uppercase block">
                          Registration No.
                        </span>
                        <span className="font-mono text-xs font-bold text-[#3B3028]">
                          {app.registration_no}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => copyToClipboard(app.registration_no!, app.id, e)}
                        className="p-1 text-[#6E5D50] hover:text-[#8B5E3C] transition cursor-pointer"
                        title="Copy Registration Number"
                      >
                        {copiedId === app.id ? (
                          <Check className="w-4 h-4 text-[#5C6B45]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-[#6E5D50] block">Applicant Name</span>
                    <span className="font-semibold text-[#3B3028]">{app.full_name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#6E5D50] block">District / Category</span>
                    <span className="font-semibold text-[#3B3028]">
                      {app.district ? `${app.district} • ` : ""}
                      {app.social_category}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#6E5D50] block">Submitted On</span>
                    <span className="font-medium text-[#3B3028]">{formatDate(app.submitted_at)}</span>
                  </div>
                </div>

                {app.status === "REJECTED" && app.rejection_reason && (
                  <div className="p-3.5 bg-[#FDF2EE] border border-[#8B5E3C]/50 rounded-xl text-sm text-[#632919]">
                    <strong>Reason from Reviewer:</strong> {app.rejection_reason}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    to={`/applications/${app.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#3B3028] bg-white hover:bg-[#EDE3D2] rounded-lg border border-[#D9C5A3] transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#8B5E3C]" />
                    <span>View Application</span>
                  </Link>

                  {app.status === "REJECTED" && !activeCategoryIds.has(app.category_id) && (
                    <Link
                      to={`/apply?category=${app.category_id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#F5EFE3] bg-[#8B5E3C] hover:bg-[#734C30] rounded-lg shadow-2xs transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Submit New Application</span>
                    </Link>
                  )}

                  {app.status === "REJECTED" && activeCategoryIds.has(app.category_id) && (
                    <span className="text-xs font-medium text-[#5C6B45] bg-[#EEF2E7] px-3 py-1.5 rounded-lg border border-[#5C6B45]/25">
                      Resubmitted for this trade
                    </span>
                  )}

                  {app.status === "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(app.id)}
                      disabled={downloadingId === app.id}
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-[#F5EFE3] bg-[#5C6B45] hover:bg-[#4A5737] rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {downloadingId === app.id
                          ? "Generating PDF..."
                          : "Download Approval Letter (PDF)"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CandidateWorkspaceShell>
  );
}
