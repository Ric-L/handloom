import React, { useState, useRef } from "react";
import { uploadDocument } from "../api";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  ExternalLink,
  Eye,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

interface FileUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
  compact?: boolean;
  buttonText?: string;
  accept?: string;
  helperText?: string;
}

export default function FileUploadField({
  label,
  value,
  onChange,
  required = false,
  compact = false,
  buttonText = "Choose File",
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  helperText = "JPG, PNG, WEBP or PDF (Max 5MB)",
}: FileUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validation: 5MB size limit
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError("File exceeds 5MB limit. Please compress or select a smaller file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validation: Supported types
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Unsupported format. Please upload JPG, PNG, WEBP, or PDF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);
      setFileName(file.name);
      const res = await uploadDocument(file);
      onChange(res.url);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to upload file. Please try again.");
      onChange("");
      setFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    onChange("");
    setFileName(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Compact Style (Used in Section 2 of Apply Online Form)
  if (compact) {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 tracking-tight flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500 font-bold">*</span>}
          </span>
          {value && (
            <span className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-blue-600" /> Uploaded
            </span>
          )}
        </label>

        <div className="relative flex items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={accept}
            className="hidden"
          />

          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`w-full flex items-center justify-between py-2 px-3 border rounded-xl text-xs cursor-pointer transition ${
              error
                ? "border-rose-400 bg-rose-50/40"
                : value
                ? "border-blue-300 bg-blue-50/30 text-blue-950"
                : "border-slate-300 bg-white hover:border-primary-400 text-slate-600"
            }`}
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <Upload className={`w-3.5 h-3.5 shrink-0 ${value ? "text-blue-600" : "text-slate-400"}`} />
              <span className="truncate font-medium text-[11px]">
                {isUploading
                  ? "Uploading document..."
                  : value
                  ? fileName || "File attached ✓"
                  : "Upload Photograph *"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isUploading ? (
                <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
              ) : value ? (
                <div className="flex items-center gap-1">
                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="p-1 text-primary-700 hover:text-primary-900 transition"
                    title="Preview file"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="px-3 py-1 bg-primary-700 hover:bg-primary-800 text-white font-bold text-[11px] rounded-lg shadow-2xs transition">
                  {buttonText}
                </span>
              )}
            </div>
          </div>
        </div>

        {error && <p className="text-[10px] text-rose-600 font-semibold">{error}</p>}
      </div>
    );
  }

  // Full / Card Style (Used in Document Checklist)
  return (
    <div className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-600 font-bold">*</span>}
        </label>
        {value ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            <CheckCircle className="w-3 h-3 text-blue-600" /> Attached
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">Pending Upload</span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={accept}
        className="hidden"
      />

      {value ? (
        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="flex items-center gap-2 truncate pr-2">
            <FileText className="w-4 h-4 text-primary-700 shrink-0" />
            <span className="truncate font-mono font-medium text-slate-800 text-[11px]">
              {fileName || value.split("/").pop()}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition"
            >
              <Eye className="w-3 h-3" /> View
            </a>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
              title="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-primary-400 rounded-xl p-3 text-center cursor-pointer transition bg-slate-50/50 hover:bg-primary-50/20"
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2 py-1 text-xs text-primary-700 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading document to server...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
              <Upload className="w-4 h-4 text-primary-600" />
              <span className="font-bold text-primary-700 hover:underline">Click to upload document</span>
              <span className="text-[10px] text-slate-400">({helperText})</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

