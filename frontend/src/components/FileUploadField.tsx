import React, { useState, useRef } from "react";
import { uploadDocument, fetchAuthenticatedDocument } from "../api";
import { Upload, CheckCircle2, AlertCircle, FileText, X, Eye, Loader2 } from "lucide-react";

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
  helperText = "Photo (JPG, PNG, WEBP) or PDF, strictly below 5 MB",
}: FileUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const maxBytes = 5 * 1024 * 1024;
    if (file.size <= 0 || file.size >= maxBytes) {
      setError("File size must be strictly below 5 MB. Please choose a smaller photo or PDF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Unsupported file type. Please upload a JPG, PNG, WEBP image, or a PDF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);
      setFileName(file.name);
      const res = await uploadDocument(file);
      onChange(res.url);
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed. Please check your internet connection and try again.");
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

  const handlePreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value || isOpening) return;
    setError(null);
    try {
      setIsOpening(true);
      const { objectUrl } = await fetchAuthenticatedDocument(value);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      setError("Could not open uploaded document. Please re-sign in or re-upload.");
    } finally {
      setIsOpening(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-slate-800 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-600">*</span>}
          </span>
          {value && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
            </span>
          )}
        </label>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={accept}
          className="hidden"
        />

        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`w-full flex items-center justify-between py-2.5 px-3.5 border rounded-xl text-sm cursor-pointer transition ${
            error
              ? "border-rose-400 bg-rose-50/40"
              : value
              ? "border-emerald-300 bg-emerald-50/40 text-slate-900"
              : "border-slate-300 bg-white hover:border-blue-400 text-slate-600"
          }`}
        >
          <div className="flex items-center gap-2.5 truncate pr-2">
            <Upload className={`w-4 h-4 shrink-0 ${value ? "text-emerald-600" : "text-slate-400"}`} />
            <span className="truncate font-medium">
              {isUploading ? "Uploading..." : value ? fileName || "File attached" : "Tap to select file"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isUploading ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            ) : value ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={isOpening}
                  className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                  title="View uploaded file"
                >
                  {isOpening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="px-3 py-1 bg-blue-700 text-white font-bold text-xs rounded-lg">
                {buttonText}
              </span>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-700 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-bold text-slate-900">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
        {value ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Uploaded
          </span>
        ) : required ? (
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            Required
          </span>
        ) : (
          <span className="text-xs text-slate-500">Optional</span>
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
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
          <div className="flex items-center gap-2.5 truncate pr-2">
            <FileText className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="truncate font-medium text-slate-800 text-xs sm:text-sm">
              {fileName || value.split("/").pop()}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isOpening}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition cursor-pointer"
            >
              {isOpening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
              <span>View</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !isUploading && fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/40"
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-blue-700 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading file...</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-700 font-bold">
                <Upload className="w-4 h-4" />
                <span>Tap here to upload file</span>
              </div>
              <p className="text-xs text-slate-500">{helperText}</p>
            </div>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
