import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { updateProfile } from "../api";
import { DEFAULT_COUNTRY, DEFAULT_STATE, MANIPUR_DISTRICTS } from "../lib/constants";
import DateOfBirthPicker from "./DateOfBirthPicker";
import type { User } from "../types";
import {
  Edit3,
  Save,
  X,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CandidateProfileCardProps {
  user: User | null;
  onUpdated: (updated: User) => void;
}

type ProfileField =
  | "full_name"
  | "father_name"
  | "mother_name"
  | "dob"
  | "email"
  | "country"
  | "state"
  | "district"
  | "address_line1"
  | "address_line2"
  | "address_line3";

type ProfileErrors = Partial<Record<ProfileField, string>>;

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function normalizeISODate(iso?: string): string {
  const s = (iso || "").trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

function formatDisplayDOB(iso?: string): string {
  const clean = normalizeISODate(iso);
  if (!clean) return "—";
  const [y, m, d] = clean.split("-");
  return `${d}/${m}/${y}`;
}

export default function CandidateProfileCard({ user, onUpdated }: CandidateProfileCardProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ProfileErrors>({});

  const [form, setForm] = useState({
    full_name: "",
    father_name: "",
    mother_name: "",
    dob: "",
    email: "",
    country: DEFAULT_COUNTRY,
    state: DEFAULT_STATE,
    district: "",
    address_line1: "",
    address_line2: "",
    address_line3: "",
  });

  const syncFromUser = (u: User | null) => {
    setForm({
      full_name: u?.full_name || "",
      father_name: u?.father_name || "",
      mother_name: u?.mother_name || "",
      dob: normalizeISODate(u?.dob),
      email: u?.email || "",
      country: u?.country || DEFAULT_COUNTRY,
      state: u?.state || DEFAULT_STATE,
      district: u?.district || "",
      address_line1: u?.address_line1 || "",
      address_line2: u?.address_line2 || "",
      address_line3: u?.address_line3 || "",
    });
  };

  useEffect(() => {
    if (!editing) {
      syncFromUser(user);
    }
  }, [user, editing]);

  const setField = (key: ProfileField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: ProfileErrors = {};
    if (form.full_name.trim().length < 2) {
      errs.full_name = "Full name is required (at least 2 characters).";
    }
    if (form.father_name.trim().length < 2) {
      errs.father_name = "Father's name is required (at least 2 characters).";
    }
    if (form.mother_name.trim().length < 2) {
      errs.mother_name = "Mother's name is required (at least 2 characters).";
    }
    if (!form.dob || !/^\d{4}-\d{2}-\d{2}$/.test(form.dob)) {
      errs.dob = "Please select a valid Date of Birth.";
    }
    if (!form.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!EMAIL_RE.test(form.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (!form.country.trim()) {
      errs.country = "Country is required.";
    }
    if (!form.state.trim()) {
      errs.state = "State is required.";
    }
    if (!form.district || !(MANIPUR_DISTRICTS as readonly string[]).includes(form.district)) {
      errs.district = "Please select a valid district of Manipur.";
    }
    if (!form.address_line1.trim()) {
      errs.address_line1 = "Address Line 1 is required.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!validate()) {
      setFormError("Please review and correct the highlighted fields below.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile({
        full_name: form.full_name.trim(),
        father_name: form.father_name.trim(),
        mother_name: form.mother_name.trim(),
        dob: form.dob,
        email: form.email.trim().toLowerCase(),
        country: form.country.trim() || DEFAULT_COUNTRY,
        state: form.state.trim() || DEFAULT_STATE,
        district: form.district,
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim() || undefined,
        address_line3: form.address_line3.trim() || undefined,
      });
      onUpdated(res.user);
      setEditing(false);
      setSuccessMsg(res.message || "Profile details updated successfully.");
    } catch (err: any) {
      const serverData = err.response?.data;
      if (serverData?.errors && typeof serverData.errors === "object") {
        setFieldErrors(serverData.errors as ProfileErrors);
      }
      setFormError(serverData?.error || "Could not update profile details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    syncFromUser(user);
    setFieldErrors({});
    setFormError("");
    setEditing(false);
  };

  const cls = (err?: string) =>
    `w-full px-3.5 py-2.5 text-sm bg-[#FAF6EE] border rounded-lg focus:bg-white focus:outline-none focus:ring-2 text-[#3B3028] placeholder-[#8D7B6D] transition ${
      err
        ? "border-[#A9442A] focus:ring-[#A9442A]/30"
        : "border-[#D9C5A3] focus:border-[#8B5E3C] focus:ring-[#8B5E3C]/25"
    }`;

  return (
    <div className="bg-white border border-[#D9C5A3] rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#E9DEC8] pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5C6B45] block">
            ACCOUNT DETAILS
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#3B3028] mt-0.5">
            {editing ? "Edit profile" : "My profile"}
          </h2>
          <p className="text-xs text-[#6E5D50] mt-0.5">
            {editing
              ? "Update your personal details or permanent Manipur address. Phone number stays tied to your login ID."
              : "Saved during candidate registration and automatically carried into new applications."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C6B45] bg-[#EEF2E7] px-3 py-1.5 rounded-full border border-[#5C6B45]/30">
            <Lock className="w-3.5 h-3.5" /> Verified Account
          </span>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                syncFromUser(user);
                setSuccessMsg("");
                setFormError("");
                setFieldErrors({});
                setEditing(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#F5EFE3] bg-[#8B5E3C] hover:bg-[#734C30] transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banners */}
      {successMsg && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-[#EEF2E7] border border-[#5C6B45]/40 text-[#3E492D] text-sm flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 text-[#5C6B45] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {formError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#FDF2EE] border border-[#8B5E3C]/50 text-[#632919] text-sm flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-[#8B5E3C] shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSave} noValidate className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-fullname" className="block text-xs font-semibold text-[#3B3028] mb-1.5">
                Full Name <span className="text-[#8B5E3C]">*</span>
              </label>
              <input
                id="prof-fullname"
                type="text"
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
                required
                className={cls(fieldErrors.full_name)}
              />
              {fieldErrors.full_name && (
                <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.full_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="prof-dob" className="block text-xs font-semibold text-[#3B3028] mb-1.5">
                Date of Birth <span className="text-[#8B5E3C]">*</span>
              </label>
              <DateOfBirthPicker
                id="prof-dob"
                value={form.dob}
                onChange={(val) => setField("dob", val)}
                required
                inputClassName={cls(fieldErrors.dob)}
              />
              {fieldErrors.dob && (
                <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.dob}</p>
              )}
            </div>

            <div>
              <label htmlFor="prof-father" className="block text-xs font-semibold text-[#3B3028] mb-1.5">
                Father&apos;s Name <span className="text-[#8B5E3C]">*</span>
              </label>
              <input
                id="prof-father"
                type="text"
                value={form.father_name}
                onChange={(e) => setField("father_name", e.target.value)}
                required
                className={cls(fieldErrors.father_name)}
              />
              {fieldErrors.father_name && (
                <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.father_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="prof-mother" className="block text-xs font-semibold text-[#3B3028] mb-1.5">
                Mother&apos;s Name <span className="text-[#8B5E3C]">*</span>
              </label>
              <input
                id="prof-mother"
                type="text"
                value={form.mother_name}
                onChange={(e) => setField("mother_name", e.target.value)}
                required
                className={cls(fieldErrors.mother_name)}
              />
              {fieldErrors.mother_name && (
                <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.mother_name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3B3028] mb-1.5">
                Phone Number <span className="text-[11px] font-normal text-[#6E5D50]">(Login ID)</span>
              </label>
              <input
                type="text"
                disabled
                value={user?.mobile_number || ""}
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#EDE3D2]/60 border border-[#D9C5A3] rounded-lg text-[#6E5D50] cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="prof-email" className="block text-xs font-semibold text-[#3B3028] mb-1.5">
                Email Address <span className="text-[#8B5E3C]">*</span>
              </label>
              <input
                id="prof-email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                required
                className={cls(fieldErrors.email)}
              />
              {fieldErrors.email && (
                <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E9DEC8]">
            <div>
              <label htmlFor="prof-country" className="block text-xs font-semibold text-[#3B3028] mb-1.5">
                Country <span className="text-[#8B5E3C]">*</span>
              </label>
              <input
                id="prof-country"
                type="text"
                value={form.country}
                onChange={(e) => setField("country", e.target.value)}
                required
                className={cls(fieldErrors.country)}
              />
              {fieldErrors.country && (
                <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.country}</p>
              )}
            </div>

            <div>
              <label htmlFor="prof-state" className="block text-xs font-semibold text-[#3B3028] mb-1.5">
                State <span className="text-[#8B5E3C]">*</span>
              </label>
              <input
                id="prof-state"
                type="text"
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
                required
                className={cls(fieldErrors.state)}
              />
              {fieldErrors.state && (
                <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.state}</p>
              )}
            </div>

            <div>
              <label htmlFor="prof-district" className="block text-xs font-semibold text-[#3B3028] mb-1.5">
                District (Manipur) <span className="text-[#8B5E3C]">*</span>
              </label>
              <select
                id="prof-district"
                value={form.district}
                onChange={(e) => setField("district", e.target.value)}
                required
                className={cls(fieldErrors.district)}
              >
                <option value="">-- Select District --</option>
                {MANIPUR_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {fieldErrors.district && (
                <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.district}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="prof-addr1" className="block text-xs font-semibold text-[#3B3028] mb-1.5">
              Address Line 1 <span className="text-[#8B5E3C]">*</span>
            </label>
            <input
              id="prof-addr1"
              type="text"
              value={form.address_line1}
              onChange={(e) => setField("address_line1", e.target.value)}
              required
              className={cls(fieldErrors.address_line1)}
            />
            {fieldErrors.address_line1 && (
              <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.address_line1}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-addr2" className="block text-xs font-semibold text-[#3B3028] mb-1.5">
                Address Line 2 <span className="font-normal text-[#6E5D50]">(Optional)</span>
              </label>
              <input
                id="prof-addr2"
                type="text"
                value={form.address_line2}
                onChange={(e) => setField("address_line2", e.target.value)}
                className={cls(fieldErrors.address_line2)}
              />
            </div>

            <div>
              <label htmlFor="prof-addr3" className="block text-xs font-semibold text-[#3B3028] mb-1.5">
                Address Line 3 <span className="font-normal text-[#6E5D50]">(Optional)</span>
              </label>
              <input
                id="prof-addr3"
                type="text"
                value={form.address_line3}
                onChange={(e) => setField("address_line3", e.target.value)}
                className={cls(fieldErrors.address_line3)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E9DEC8] flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#D9C5A3] bg-white hover:bg-[#EDE3D2] text-sm font-semibold text-[#3B3028] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] text-sm font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D50] block">
                Full Name
              </span>
              <span className="text-sm font-bold text-[#3B3028] mt-1 block">
                {user?.full_name || "—"}
              </span>
            </div>

            <div className="p-3.5 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D50] block">
                Date of Birth
              </span>
              <span className="text-sm font-bold text-[#3B3028] mt-1 block">
                {formatDisplayDOB(user?.dob)}
              </span>
            </div>

            <div className="p-3.5 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D50] block">
                Father&apos;s Name
              </span>
              <span className="text-sm font-bold text-[#3B3028] mt-1 block">
                {user?.father_name || "—"}
              </span>
            </div>

            <div className="p-3.5 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D50] block">
                Mother&apos;s Name
              </span>
              <span className="text-sm font-bold text-[#3B3028] mt-1 block">
                {user?.mother_name || "—"}
              </span>
            </div>

            <div className="p-3.5 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D50] block">
                Phone Number
              </span>
              <span className="text-sm font-mono font-bold text-[#3B3028] mt-1 block">
                {user?.mobile_number || "—"}
              </span>
            </div>

            <div className="p-3.5 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D50] block">
                Email Address
              </span>
              <span className="text-sm font-medium text-[#3B3028] mt-1 block">
                {user?.email || "—"}
              </span>
            </div>

            <div className="sm:col-span-2 p-3.5 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D50] block">
                District, State &amp; Country
              </span>
              <span className="text-sm font-bold text-[#3B3028] mt-1 block">
                {[user?.district, user?.state || DEFAULT_STATE, user?.country || DEFAULT_COUNTRY]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>

            <div className="sm:col-span-2 p-3.5 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D50] block">
                Residential Address
              </span>
              <span className="text-sm font-medium text-[#3B3028] mt-1 block">
                {[user?.address_line1, user?.address_line2, user?.address_line3]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E9DEC8] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#6E5D50]">
              Ready to apply? Your personal and address details will pre-fill Step 1 automatically.
            </span>
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] text-sm font-semibold rounded-lg transition"
            >
              <span>Start Application</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
