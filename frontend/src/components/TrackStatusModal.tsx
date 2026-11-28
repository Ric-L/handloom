import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { trackApplication } from "../api";
import DateOfBirthPicker from "./DateOfBirthPicker";
import { Search, AlertCircle, X } from "lucide-react";

interface TrackStatusFormProps {
  onSuccessClose?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export function TrackStatusForm({
  onSuccessClose,
  showCloseButton = false,
  onClose,
}: TrackStatusFormProps) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setError("Please enter your Registration Number or 10-digit Phone Number.");
      return;
    }
    if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setError("Please enter or select your Date of Birth (DD/MM/YYYY).");
      return;
    }

    setSearching(true);
    try {
      const data = await trackApplication(trimmedId, dob);
      onSuccessClose?.();
      navigate(
        `/track/details?identifier=${encodeURIComponent(trimmedId)}&dob=${encodeURIComponent(dob)}`,
        { state: { result: data } }
      );
    } catch {
      setError(
        "We could not find an application matching those details. Please check your Registration Number (or 10-digit mobile number) and Date of Birth."
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#D9C5A3] p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex items-start justify-between gap-3 border-b border-[#E9DEC8] pb-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] text-[#8B5E3C] flex items-center justify-center border border-[#D9C5A3] shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5C6B45] block">
              INSTANT TRACKER
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#3B3028]">
              Check your application status
            </h2>
            <p className="text-sm text-[#6E5D50]">
              No sign-in needed. Enter your Registration Number or Mobile Number along with Date of Birth.
            </p>
          </div>
        </div>

        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close track status modal"
            className="p-2 rounded-lg text-[#6E5D50] hover:text-[#3B3028] hover:bg-[#EDE3D2] border border-[#D9C5A3] transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="modal-track-id" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
              Registration Number or Phone Number
            </label>
            <input
              id="modal-track-id"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="e.g. HND-2026-EMB-AB12CD or 9876543210"
              className="w-full border border-[#D9C5A3] rounded-lg px-4 py-3 text-sm text-[#3B3028] focus:ring-2 focus:ring-[#8B5E3C]/25 focus:border-[#8B5E3C] focus:outline-none bg-[#FAF6EE] focus:bg-white placeholder-[#8D7B6D]"
            />
          </div>

          <div>
            <label htmlFor="modal-track-dob" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
              Date of Birth
            </label>
            <DateOfBirthPicker
              id="modal-track-dob"
              value={dob}
              onChange={setDob}
              required
              showAge={false}
              inputClassName="w-full border border-[#D9C5A3] rounded-lg px-4 py-3 text-sm text-[#3B3028] focus:ring-2 focus:ring-[#8B5E3C]/25 focus:border-[#8B5E3C] focus:outline-none bg-[#FAF6EE] focus:bg-white placeholder-[#8D7B6D]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={searching}
          className="w-full sm:w-auto px-8 py-3 bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] font-semibold rounded-lg text-sm transition shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {searching ? "Checking Status..." : "Check Status"}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="p-4 text-sm text-[#632919] bg-[#FDF2EE] border border-[#8B5E3C]/50 rounded-xl flex items-start gap-2.5"
        >
          <AlertCircle className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

interface TrackStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrackStatusModal({ isOpen, onClose }: TrackStatusModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Check your application status"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-[#2A211B]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-3xl my-auto">
        <TrackStatusForm
          showCloseButton
          onClose={onClose}
          onSuccessClose={onClose}
        />
      </div>
    </div>
  );
}
