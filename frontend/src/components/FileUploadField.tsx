import React, { useState, useRef } from "react";
import { uploadDocument, fetchAuthenticatedDocument } from "../api";
import { Upload, CheckCircle2, AlertCircle, FileText, X, Eye, Loader2 } from "lucide-react";

interface FileUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
  compact?: boolean;
  readOnly?: boolean;
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
  readOnly = false,
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
        <label className="text-sm font-semibold text-[#3B3028] flex items-center justify-between">
          <span>
            {label} {required && <span className="text-[#8B5E3C]">*</span>}
          </span>
          {value && (
            <span className="text-xs font-semibold text-[#5C6B45] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
            </span>
          )}
        </label>

        {!readOnly && (
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={accept}
            className="hidden"
          />
        )}

        <div
          onClick={() => !readOnly && !isUploading && fileInputRef.current?.click()}
          className={`w-full flex items-center justify-between py-2.5 px-3.5 border rounded-lg text-sm transition ${
            readOnly ? "cursor-default" : "cursor-pointer"
          } ${
            error
              ? "border-[#A9442A] bg-[#FDF2EE]"
              : value
              ? "border-[#5C6B45] bg-[#EEF2E7]/60 text-[#3B3028]"
              : "border-[#D9C5A3] bg-[#FAF6EE] hover:border-[#8B5E3C] text-[#6E5D50]"
          }`}
        >
          <div className="flex items-center gap-2.5 truncate pr-2">
            <Upload className={`w-4 h-4 shrink-0 ${value ? "text-[#5C6B45]" : "text-[#8D7B6D]"}`} />
            <span className="truncate font-medium">
              {isUploading
                ? "Uploading..."
                : value
                ? fileName || "File attached"
                : readOnly
                ? "Not provided"
                : "Tap to select file"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isUploading ? (
              <Loader2 className="w-4 h-4 text-[#8B5E3C] animate-spin" />
            ) : value ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={isOpening}
                  className="p-1.5 text-[#8B5E3C] hover:bg-[#EDE3D2] rounded-lg transition cursor-pointer"
                  title="View uploaded file"
                >
                  {isOpening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    className="p-1.5 text-[#6E5D50] hover:text-[#A9442A] hover:bg-[#FDF2EE] rounded-lg transition cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : readOnly ? null : (
              <span className="px-3 py-1 bg-[#8B5E3C] text-[#F5EFE3] font-semibold text-xs rounded-md">
                {buttonText}
              </span>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-[#A9442A] font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-[#D9C5A3] bg-[#FAF6EE] space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-[#3B3028]">
          {label} {required && <span className="text-[#8B5E3C]">*</span>}
        </label>
        {value ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#3E492D] bg-[#EEF2E7] px-2.5 py-0.5 rounded-full border border-[#5C6B45]/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5C6B45]" /> Uploaded
          </span>
        ) : required ? (
          <span className="text-xs font-semibold text-[#8B5E3C] bg-[#F3EAE2] px-2.5 py-0.5 rounded-full border border-[#D9C5A3]">
            Required
          </span>
        ) : (
          <span className="text-xs text-[#6E5D50]">Optional</span>
        )}
      </div>

      {!readOnly && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={accept}
          className="hidden"
        />
      )}

      {value ? (
        <div className="flex items-center justify-between p-3 bg-white border border-[#D9C5A3] rounded-lg text-sm">
          <div className="flex items-center gap-2.5 truncate pr-2">
            <FileText className="w-4 h-4 text-[#5C6B45] shrink-0" />
            <span className="truncate font-medium text-[#3B3028] text-xs sm:text-sm">
              {fileName || value.split("/").pop()}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isOpening}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#8B5E3C] bg-[#FAF6EE] border border-[#D9C5A3] rounded-md hover:bg-[#EDE3D2] transition cursor-pointer"
            >
              {isOpening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
              <span>View</span>
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-[#6E5D50] hover:text-[#A9442A] hover:bg-[#FDF2EE] rounded-md transition cursor-pointer"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : readOnly ? (
        <div className="p-3 bg-white/60 border border-[#D9C5A3] rounded-lg text-xs text-[#6E5D50]">
          Not uploaded
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !isUploading && fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full border-2 border-dashed border-[#D9C5A3] hover:border-[#8B5E3C] rounded-lg p-4 text-center cursor-pointer transition bg-white hover:bg-[#F5EFE3]/70"
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-[#8B5E3C] font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading file...</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-sm text-[#8B5E3C] font-semibold">
                <Upload className="w-4 h-4" />
                <span>Tap here to upload file</span>
              </div>
              <p className="text-xs text-[#6E5D50]">{helperText}</p>
            </div>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-[#A9442A] font-medium flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-[#A9442A] shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
