import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import mhhdclLogoPdf from "../assets/mhhdcl-logo-pdf.png?inline";

export interface ProjectNotice {
  id: string;
  refNo: string;
  title: string;
  category: "Admission" | "DBT & Finance" | "Verification" | "Schedule" | "Policy";
  date: string;
  isNew?: boolean;
  fileSize: string;
  summary: string;
  signedBy: string;
}

export interface ProjectUpdate {
  id: string;
  title: string;
  date: string;
  tag: string;
  isHot?: boolean;
  content: string;
  author: string;
}

export const OFFICIAL_NOTICES: ProjectNotice[] = [
  {
    id: "not-01",
    refNo: "MHHDC-122/HWT/2026/041",
    title: "Admission Notice: Applications Invited for Residential Skill Training across 9 Craft Trades (PM VIKAS Scheme Quota)",
    category: "Admission",
    date: "12 Nov 2026",
    isNew: true,
    fileSize: "245 KB",
    summary:
      "Manipur Handloom & Handicrafts Development Corporation Ltd. (MHHDC) invites applications under its allocated PM VIKAS Scheme quota across handloom weaving, jacquard weaving, hand embroidery, bamboo work, and allied trades. Training is free with stipend support.",
    signedBy: "Admissions Controller, MHHDC Training Cell",
  },
  {
    id: "not-02",
    refNo: "MHHDC-122/HWT/2026/039",
    title: "Operating Guidelines for Direct Benefit Transfer (DBT) Monthly Trainee Sustenance Stipend Disbursement",
    category: "DBT & Finance",
    date: "08 Nov 2026",
    isNew: true,
    fileSize: "310 KB",
    summary:
      "Detailed operational guidelines regarding Aadhaar-seeded bank account cross-verification and biometric attendance prerequisites (minimum 80% monthly attendance) for stipend release under MHHDC's PM VIKAS quota batches.",
    signedBy: "Finance & DBT Desk, MHHDC",
  },
  {
    id: "not-03",
    refNo: "MHHDC-122/HWT/2026/035",
    title: "Physical Cross-Verification Schedule & Document Checklist for Approved Trainees at Training Centres",
    category: "Verification",
    date: "02 Nov 2026",
    fileSize: "190 KB",
    summary:
      "Schedule of dates for approved candidates to report to their designated training centres with original Govt-issued ID, educational certificates, and Bank Passbook.",
    signedBy: "Training Coordinator, MHHDC Skill Division",
  },
  {
    id: "not-04",
    refNo: "MHHDC-122/HWT/2026/028",
    title: "Training Facilities, Equipment Standards & Master Craft Instructor Allocation List",
    category: "Schedule",
    date: "26 Oct 2026",
    fileSize: "420 KB",
    summary:
      "Comprehensive directory of partner training workshops, loom equipment provisions, and master weaver instructors assigned across clusters.",
    signedBy: "Technical Coordinator, MHHDC Skill Division",
  },
  {
    id: "not-05",
    refNo: "MHHDC-122/HWT/2026/021",
    title: "Eligibility & Category Reservation Norms for MHHDC Skill Training Admissions",
    category: "Policy",
    date: "15 Oct 2026",
    fileSize: "280 KB",
    summary:
      "Seat allocation guidelines for eligible weavers, minorities, SC/ST, OBC, and PwD artisan communities with strict quota capacity locking.",
    signedBy: "Managing Director's Secretariat, MHHDC",
  },
];

export const PROJECT_UPDATES: ProjectUpdate[] = [
  {
    id: "upd-01",
    title: "Batch Induction Announced for Merchandiser & Hand Embroidery Candidates commencing 1st Dec 2026",
    date: "12 Nov 2026",
    tag: "Batch Announcement",
    isHot: true,
    content:
      "Candidates approved under Trade MER-01 (Merchandiser) and EMB-02 (Traditional Hand Embroiderer) are hereby informed that the first batch of practical training commences on 1st December 2026. Reporting instructions and centre timings are available on your dashboard.",
    author: "MHHDC Admissions Cell",
  },
  {
    id: "upd-02",
    title: "Digital Enrolment Confirmation Slips Now Live for Instant Download on Trainee Dashboard",
    date: "11 Nov 2026",
    tag: "Portal Feature",
    isHot: true,
    content:
      "Approved candidates can now download their standardized Enrolment Confirmation Slip (PDF) directly from their MHHDC portal dashboard. The slip features digital endorsement, verification hash, and assigned centre instructions.",
    author: "MHHDC IT & Systems Desk",
  },
  {
    id: "upd-03",
    title: "MHHDC Allocates Training Seats Across 9 Traditional Trades Under PM VIKAS Scheme Quota",
    date: "05 Nov 2026",
    tag: "Quota Allocation",
    content:
      "Under its allocated quota for the PM VIKAS Scheme, Manipur Handloom & Handicrafts Development Corporation Ltd. (MHHDC) is conducting online admissions across 9 traditional handloom and craft disciplines with monthly stipend assistance.",
    author: "MHHDC Admissions Desk",
  },
  {
    id: "upd-04",
    title: "Atomic Row-Level Quota Allocation Guard Deployed for Transparent Seat Management",
    date: "28 Oct 2026",
    tag: "Admissions Integrity",
    content:
      "The MHHDC admission portal enforces strict row-level locking in PostgreSQL. When category seat capacity is reached, further approvals lock automatically to prevent over-allocation.",
    author: "MHHDC Systems Administration",
  },
  {
    id: "upd-05",
    title: "Master Weaver Consultation Workshops Concluded across 6 Regional Handloom Clusters",
    date: "20 Oct 2026",
    tag: "Cluster Operations",
    content:
      "State-level workshops with traditional master weavers have finalized the hands-on practical curriculum to blend heritage motifs with contemporary textile merchandise standards.",
    author: "Field Operations Unit",
  },
];

// Utility to generate a formal PDF circular on the fly for any notice
export function generateOfficialNoticePDF(notice: ProjectNotice) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color Palette
  const navy = [30, 58, 138];
  const slate = [51, 65, 85];
  const gold = [180, 83, 9];

  // Border Frame
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(0.8);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(11.5, 11.5, pageWidth - 23, pageHeight - 23);

  // Corporate Header with MHHDCL Logo
  try {
    doc.addImage(mhhdclLogoPdf, "PNG", 14, 15.5, 10, 18);
  } catch {
    // Continue gracefully if image rendering is unavailable
  }

  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("MANIPUR HANDLOOM & HANDICRAFTS DEVELOPMENT CORPORATION LTD.", pageWidth / 2, 22, { align: "center" });

  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.setFontSize(8.5);
  doc.text("REGISTRATION & ADMISSION PORTAL • SKILL TRAINING UNDER PM VIKAS SCHEME QUOTA", pageWidth / 2, 28, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Governor Road, Paona Bazar, Imphal 795001 • Tel: 0385-245 1495", pageWidth / 2, 33, { align: "center" });

  // Tricolor horizontal rule
  doc.setFillColor(245, 158, 11);
  doc.rect(14, 36, (pageWidth - 28) / 3, 0.8, "F");
  doc.setFillColor(203, 213, 225);
  doc.rect(14 + (pageWidth - 28) / 3, 36, (pageWidth - 28) / 3, 0.8, "F");
  doc.setFillColor(22, 163, 74);
  doc.rect(14 + ((pageWidth - 28) / 3) * 2, 36, (pageWidth - 28) / 3, 0.8, "F");

  // Meta Box
  let y = 42;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 16, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`OFFICIAL CIRCULAR / NOTIFICATION REF: ${notice.refNo}`, 18, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Issue Date: ${notice.date}   •   Category: ${notice.category}   •   Classification: Public Circular`, 18, y + 12);

  // Title Banner
  y += 22;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.roundedRect(14, y, pageWidth - 28, 12, 1, 1, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const titleLines = doc.splitTextToSize(notice.title.toUpperCase(), pageWidth - 36);
  doc.text(titleLines, pageWidth / 2, y + 5, { align: "center" });

  // Body Content Table
  y += 18;
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    theme: "plain",
    head: [
      [
        {
          content: "OFFICIAL NOTIFICATION DETAILS & ADMINISTRATIVE BRIEF",
          colSpan: 2,
          styles: {
            fillColor: [241, 245, 249],
            textColor: [15, 39, 87],
            fontStyle: "bold",
            fontSize: 8.5,
          },
        },
      ],
    ],
    body: [
      [
        { content: "Reference No:", styles: { fontStyle: "bold", cellWidth: 35 } },
        { content: notice.refNo, styles: { fontStyle: "bold", font: "courier" } },
      ],
      [
        { content: "Publication Date:", styles: { fontStyle: "bold" } },
        { content: notice.date },
      ],
      [
        { content: "Applicable Scope:", styles: { fontStyle: "bold" } },
        { content: "All Participating MHHDC Skill Training Centres & Applicants" },
      ],
      [
        { content: "Notice Summary:", styles: { fontStyle: "bold" } },
        { content: notice.summary, styles: { cellPadding: 3, textColor: [30, 41, 59] } },
      ],
    ],
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;

  // Directive Points
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("KEY GUIDELINES & ADMISSION INSTRUCTIONS:", 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  const directives = [
    "1. All candidates and training centre coordinators are advised to follow the terms outlined herein.",
    "2. For admitted trainees, biometric attendance monitoring commences upon batch start.",
    "3. For enquiries regarding this notice, contact MHHDC Head Office, Paona Bazar, Imphal (Tel: 0385-245 1495).",
    "4. Admissions are conducted by MHHDC under the PM VIKAS Scheme.",
  ];
  directives.forEach((d, i) => {
    doc.text(d, 14, y + 6 + i * 5);
  });

  // Endorsement Block
  const endorseY = pageHeight - 38;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, endorseY - 2, pageWidth - 14, endorseY - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("ISSUED BY MHHDC ADMISSIONS DESK:", 14, endorseY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(notice.signedBy, 14, endorseY + 9);
  doc.text("Manipur Handloom & Handicrafts Development Corporation Ltd.", 14, endorseY + 13);

  doc.setFont("courier", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`[ DIGITAL VERIFICATION REF: ${notice.id.toUpperCase()}-MHHDC ]`, pageWidth - 14, endorseY + 13, {
    align: "right",
  });

  // Footer
  const footerY = pageHeight - 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Manipur Handloom & Handicrafts Development Corp. Ltd. • Admission Circular • System Generated Copy", 14, footerY);
  doc.text("Page 1 of 1", pageWidth - 14, footerY, { align: "right" });

  doc.save(`Notice_${notice.refNo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

