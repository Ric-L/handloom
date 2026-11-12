import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
    refNo: "NOT-HND/2026/041",
    title: "Official Notification: Admissions Open for Academic Session 2026-2027 across 9 Accredited Artisan Trades",
    category: "Admission",
    date: "12 Nov 2026",
    isNew: true,
    fileSize: "245 KB",
    summary:
      "Directorate of Handloom & Skilled Artisan Development invites applications for 3,020 sanctioned training seats across handloom, jacquard weaving, hand embroidery, bamboo work, and allied trades. Enrolment is free with monthly DBT stipend backing.",
    signedBy: "State Admissions Controller, Directorate of Handloom",
  },
  {
    id: "not-02",
    refNo: "NOT-HND/2026/039",
    title: "Operating Guidelines for Direct Benefit Transfer (DBT) Monthly Trainee Sustenance Stipend Disbursement",
    category: "DBT & Finance",
    date: "08 Nov 2026",
    isNew: true,
    fileSize: "310 KB",
    summary:
      "Detailed operational guidelines regarding Aadhaar-seeded bank account cross-verification and biometric attendance prerequisites (minimum 80% monthly attendance) for DBT stipend release.",
    signedBy: "Joint Director (Finance & DBT), Ministry of Textiles Cell",
  },
  {
    id: "not-03",
    refNo: "NOT-HND/2026/035",
    title: "Physical Cross-Verification Schedule & Document Checklist for Approved Artisan Batches at District Centres",
    category: "Verification",
    date: "02 Nov 2026",
    fileSize: "190 KB",
    summary:
      "Schedule of dates for approved candidates to report to their designated District Handloom Training Centres with original Government ID, educational certificates, and Bank Passbook.",
    signedBy: "Director of Training, Handloom Skill Development Mission",
  },
  {
    id: "not-04",
    refNo: "NOT-HND/2026/028",
    title: "Accredited Training Facilities, Equipment Standards & Master Craft Instructor Allocation List",
    category: "Schedule",
    date: "26 Oct 2026",
    fileSize: "420 KB",
    summary:
      "Comprehensive directory of verified training workshops, loom equipment provisions, and National Awardee master weaver mentors assigned across district clusters.",
    signedBy: "Technical Coordinator, Textile Sector Skill Council",
  },
  {
    id: "not-05",
    refNo: "NOT-HND/2026/021",
    title: "Affirmative Action Guidelines & Social Category Reservation Norms for Artisan Skill Intake",
    category: "Policy",
    date: "15 Oct 2026",
    fileSize: "280 KB",
    summary:
      "Affirmative action intake distribution guaranteeing equitable participation for rural weavers, SC/ST, and OBC artisan communities with atomic capacity locking.",
    signedBy: "Special Secretary, Directorate of Handloom & Textiles",
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
      "Candidates approved under Trade MER-01 (Merchandiser) and EMB-02 (Traditional Hand Embroiderer) are hereby informed that the first batch of practical training commences on 1st December 2026. Reporting instructions and centre timings have been uploaded to the candidate portal.",
    author: "Admissions Directorate",
  },
  {
    id: "upd-02",
    title: "Digital Enrolment Confirmation Slips Now Live for Instant Download on Trainee Dashboard",
    date: "11 Nov 2026",
    tag: "Portal Feature",
    isHot: true,
    content:
      "Approved candidates can now download their formal, government-standard Enrolment Confirmation Slip (PDF) directly from their portal dashboard. The slip features official digital endorsement, verification hash, and assigned centre instructions.",
    author: "IT & Systems Cell",
  },
  {
    id: "upd-03",
    title: "Ministry of Textiles Sanctions 3,020 Affirmative Action Training Seats for Artisan Empowerment",
    date: "05 Nov 2026",
    tag: "Government Sanction",
    content:
      "Under the National Handloom Development Programme, the Ministry of Textiles has officially approved 3,020 subsidized training berths across 9 traditional craft disciplines with direct DBT monthly stipend assistance.",
    author: "Ministry Press Desk",
  },
  {
    id: "upd-04",
    title: "Autonomous ACID Row-Level Quota Allocation Guard Deployed to Guarantee Fair Trainee Intake",
    date: "28 Oct 2026",
    tag: "Admissions Integrity",
    content:
      "The Handloom Project admission engine now enforces strict row-level locking (SELECT FOR UPDATE) in PostgreSQL. When sanctioned category capacity is reached, further approvals lock atomically, eliminating quota over-allocations.",
    author: "Technical Administration",
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

  // Official Header
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("DIRECTORATE OF HANDLOOM & SKILLED ARTISAN DEVELOPMENT", pageWidth / 2, 22, { align: "center" });

  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.setFontSize(9);
  doc.text("HANDLOOM PROJECT • SKILLED ARTISAN ADMISSION & SKILL DEVELOPMENT MISSION", pageWidth / 2, 28, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Government Accredited Affirmative Action Skill Training Initiative", pageWidth / 2, 33, { align: "center" });

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
        { content: "Regulatory Scope:", styles: { fontStyle: "bold" } },
        { content: "All Accredited Handloom & Skilled Artisan Development Training Centers" },
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
  doc.text("EXECUTIVE DIRECTIVES & COMPLIANCE REQUIREMENTS:", 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  const directives = [
    "1. All candidates and training centre coordinators are instructed to comply with the terms stipulated herein.",
    "2. For verified candidate admissions, biometric attendance monitoring commences immediately upon batch start.",
    "3. Any grievance or clarification regarding this circular may be reported to the National Careline at 1800-200-7890.",
    "4. This notification supersedes any previous verbal communication and is officially binding under mission guidelines.",
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
  doc.text("ISSUED BY ORDER OF THE COMPETENT AUTHORITY:", 14, endorseY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(notice.signedBy, 14, endorseY + 9);
  doc.text("Directorate of Handloom & Skilled Artisan Development", 14, endorseY + 13);

  doc.setFont("courier", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`[ DIGITAL SIGNATURE HASH: ${notice.id.toUpperCase()}-SECURE-GOV ]`, pageWidth - 14, endorseY + 13, {
    align: "right",
  });

  // Footer
  const footerY = pageHeight - 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Handloom Project • Official Digital Government Circular • System Generated Copy", 14, footerY);
  doc.text("Page 1 of 1", pageWidth - 14, footerY, { align: "right" });

  doc.save(`Notice_${notice.refNo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

