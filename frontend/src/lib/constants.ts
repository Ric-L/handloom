export const JOB_CATEGORIES = [
  { code: "MER.01", title: "Merchandiser – Fashion, Made-Ups & Home Furnishings", quota: 800 },
  { code: "EMB.02", title: "Traditional Hand Embroiderer", quota: 400 },
  { code: "JQW.03", title: "Jacquard Weaver (TSC/Q7306)", quota: 360 },
  { code: "LLW.04", title: "Loin Loom Weaver (TSC/Q7307)", quota: 350 },
  { code: "BWA.05", title: "Bamboo Work Artisan", quota: 300 },
  { code: "APA.06", title: "Applique Artisan", quota: 290 },
  { code: "TPM.07", title: "Traditional Painting Maker-Artisan", quota: 240 },
  { code: "CPW.08", title: "Carpet Weaver", quota: 220 },
  { code: "PPM.09", title: "Puppet Maker", quota: 60 },
] as const;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";
export const MAX_FILE_SIZE_MB = 5;
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const MANIPUR_DISTRICTS = [
  "Bishnupur",
  "Chandel",
  "Churachandpur",
  "Imphal East",
  "Imphal West",
  "Jiribam",
  "Kakching",
  "Kamjong",
  "Kangpokpi",
  "Noney",
  "Pherzawl",
  "Senapati",
  "Tamenglong",
  "Tengnoupal",
  "Thoubal",
  "Ukhrul",
] as const;

export const DEFAULT_COUNTRY = "India";
export const DEFAULT_STATE = "Manipur";
