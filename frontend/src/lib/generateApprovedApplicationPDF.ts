import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ApprovedSlipData } from "../types";
import { formatDate } from "./utils";

export function generateApprovedApplicationPDF(app: ApprovedSlipData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color Palette (Deep Official Navy & Slate Blue)
  const navyDark = [15, 39, 87]; // #0f2757
  const navyPrimary = [30, 58, 138]; // #1e3a8a
  const slateDark = [51, 65, 85]; // #334155
  const slateLight = [241, 245, 249]; // #f1f5f9
  const emeraldGreen = [21, 128, 61]; // #15803d
  const goldAccent = [180, 83, 9]; // #b45309

  // 1. Double Border Frame
  doc.setDrawColor(navyPrimary[0], navyPrimary[1], navyPrimary[2]);
  doc.setLineWidth(0.7);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  doc.setDrawColor(180, 195, 220);
  doc.setLineWidth(0.3);
  doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

  // Corner security accents
  const drawCorner = (x: number, y: number, s: number) => {
    doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.setLineWidth(0.6);
    doc.line(x, y, x + s, y);
    doc.line(x, y, x, y + s);
  };
  drawCorner(11, 11, 6);
  drawCorner(pageWidth - 11, 11, -6);
  drawCorner(11, pageHeight - 11, 6);
  drawCorner(pageWidth - 11, pageHeight - 11, -6);

  // 2. Top Emblem & Government Mission Header
  doc.setTextColor(navyPrimary[0], navyPrimary[1], navyPrimary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("DIRECTORATE OF HANDLOOM & SKILLED ARTISAN DEVELOPMENT", pageWidth / 2, 17, { align: "center" });

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("HANDLOOM PROJECT • SKILLED ARTISAN ADMISSION & SKILL DEVELOPMENT MISSION", pageWidth / 2, 22, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Accredited Affirmative Action Vocational Training & Artisan Enrolment Portal", pageWidth / 2, 26, { align: "center" });

  // Tricolor subtle horizontal rule
  const ruleY = 28.5;
  const ruleStart = 14;
  const ruleW = (pageWidth - 28) / 3;
  doc.setFillColor(245, 158, 11); // Saffron
  doc.rect(ruleStart, ruleY, ruleW, 0.8, "F");
  doc.setFillColor(203, 213, 225); // White/Grey
  doc.rect(ruleStart + ruleW, ruleY, ruleW, 0.8, "F");
  doc.setFillColor(22, 163, 74); // Green
  doc.rect(ruleStart + ruleW * 2, ruleY, ruleW, 0.8, "F");

  // 3. Official Title Banner
  doc.setFillColor(navyPrimary[0], navyPrimary[1], navyPrimary[2]);
  doc.roundedRect(14, 32, pageWidth - 28, 8, 1, 1, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("OFFICIAL ADMISSION & ENROLMENT CONFIRMATION SLIP (SESSION 2026-2027)", pageWidth / 2, 37.5, {
    align: "center",
  });

  // 4. Reference & Approval Seal Header Grid
  let y = 43;

  // Box Left: Enrolment Identification
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, 98, 16, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("OFFICIAL ENROLMENT NO (REGISTRATION REF):", 17, y + 4.5);

  doc.setFont("courier", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(navyPrimary[0], navyPrimary[1], navyPrimary[2]);
  doc.text(app.registration_no || "HND-2026-PENDING", 17, y + 10.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Applied: ${formatDate(app.submitted_at)}  •  Verified & Sanctioned via ACID Quota Guard`, 17, y + 14);

  // Box Right: Status & Sanction Seal
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(115, y, pageWidth - 115 - 14, 16, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text("ADMISSION STATUS:", 118, y + 4.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("✓ APPROVED & ALLOCATED", 118, y + 10.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  const approvalDate = app.reviewed_at ? formatDate(app.reviewed_at) : formatDate(new Date().toISOString());
  doc.text(`Official Approval Date: ${approvalDate}`, 118, y + 14);

  y += 19;

  // 5. Section I: Trainee Personal Dossier
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    theme: "plain",
    head: [
      [
        {
          content: "SECTION I: ARTISAN TRAINEE PERSONAL DOSSIER & IDENTITY VERIFICATION",
          colSpan: 4,
          styles: {
            fillColor: [30, 58, 138],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
            cellPadding: 2,
          },
        },
      ],
    ],
    body: [
      [
        { content: "Candidate Full Name:", styles: { fontStyle: "bold", cellWidth: 42 } },
        { content: app.full_name, styles: { fontStyle: "bold", textColor: [15, 39, 87] } },
        { content: "Father / Guardian Name:", styles: { fontStyle: "bold", cellWidth: 40 } },
        { content: app.guardian_name },
      ],
      [
        { content: "Date of Birth:", styles: { fontStyle: "bold" } },
        { content: formatDate(app.dob) },
        { content: "Gender / Social Category:", styles: { fontStyle: "bold" } },
        { content: `${app.gender}  /  ${app.social_category}` },
      ],
      [
        { content: "Government ID Verified:", styles: { fontStyle: "bold" } },
        { content: `${app.gov_id_type} (Last 4: •••• ${app.gov_id_last4})`, styles: { fontStyle: "bold" } },
        { content: "Academic Qualification:", styles: { fontStyle: "bold" } },
        { content: app.highest_qual },
      ],
      [
        { content: "Residential Address:", styles: { fontStyle: "bold" } },
        { content: app.address_full || "On Record", colSpan: 3 },
      ],
      [
        { content: "District, State & PIN:", styles: { fontStyle: "bold" } },
        { content: app.district_state_pin, colSpan: 3, styles: { fontStyle: "bold" } },
      ],
    ],
    styles: {
      fontSize: 7.5,
      cellPadding: 1.6,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 3;

  // 6. Section II: Sanctioned Craft Trade Category
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    theme: "plain",
    head: [
      [
        {
          content: "SECTION II: SANCTIONED CRAFT TRADE & TRAINING SEAT ALLOCATION",
          colSpan: 4,
          styles: {
            fillColor: [30, 58, 138],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
            cellPadding: 2,
          },
        },
      ],
    ],
    body: [
      [
        { content: "Allocated Trade Code:", styles: { fontStyle: "bold", cellWidth: 42 } },
        { content: app.category_code, styles: { fontStyle: "bold", textColor: [15, 39, 87] } },
        { content: "Artisan Trade Title:", styles: { fontStyle: "bold", cellWidth: 40 } },
        { content: app.category_title, styles: { fontStyle: "bold" } },
      ],
      [
        { content: "Training Mode Approved:", styles: { fontStyle: "bold" } },
        { content: app.training_mode || "CLASSROOM WORKSHOP" },
        { content: "Curriculum Standard:", styles: { fontStyle: "bold" } },
        { content: "NSQF Compliant Artisan Module" },
      ],
      [
        { content: "Allocated Training Centre:", styles: { fontStyle: "bold" } },
        { content: app.preferred_centre || "District Handloom Skill & Production Training Centre", colSpan: 3 },
      ],
      [
        { content: "Current Trainee Status:", styles: { fontStyle: "bold" } },
        { content: app.occupation || "SELF_EMPLOYED", colSpan: 3 },
      ],
    ],
    styles: {
      fontSize: 7.5,
      cellPadding: 1.6,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 3;

  // 7. Section III: Direct Benefit Transfer (DBT) Banking Details
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    theme: "plain",
    head: [
      [
        {
          content: "SECTION III: DIRECT BENEFIT TRANSFER (DBT) STIPEND ACCOUNT PROFILE",
          colSpan: 4,
          styles: {
            fillColor: [30, 58, 138],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
            cellPadding: 2,
          },
        },
      ],
    ],
    body: [
      [
        { content: "Bank Account Holder:", styles: { fontStyle: "bold", cellWidth: 42 } },
        { content: app.bank_holder_name || app.full_name },
        { content: "Bank & Branch Name:", styles: { fontStyle: "bold", cellWidth: 40 } },
        { content: app.bank_name_branch || "Verified Schedule Commercial Bank" },
      ],
      [
        { content: "Aadhaar / Bank A/C No:", styles: { fontStyle: "bold" } },
        {
          content: app.account_number ? `•••• •••• ${app.account_number.slice(-4)}` : "Verified On File",
          styles: { fontStyle: "bold", font: "courier" },
        },
        { content: "Bank IFSC Code:", styles: { fontStyle: "bold" } },
        { content: app.ifsc_code || "VERIFIED", styles: { fontStyle: "bold", font: "courier" } },
      ],
      [
        { content: "DBT Direct Transfer Status:", styles: { fontStyle: "bold" } },
        {
          content: "✓ VERIFIED & LINKED FOR MONTHLY APPRENTICESHIP STIPEND",
          colSpan: 3,
          styles: { fontStyle: "bold", textColor: [21, 128, 61] },
        },
      ],
    ],
    styles: {
      fontSize: 7.5,
      cellPadding: 1.6,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 3;

  // 8. Section IV: Official Verification & Security Stamp Block
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    theme: "plain",
    head: [
      [
        {
          content: "SECTION IV: ADMINISTRATIVE SCRUTINY & AUDIT ATTESTATION",
          colSpan: 2,
          styles: {
            fillColor: [30, 58, 138],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
            cellPadding: 2,
          },
        },
      ],
    ],
    body: [
      [
        {
          content:
            "Scrutiny Clearance:\n• Identity & Social Category proofs vetted\n• Category Quota seat reserved & row-level locked\n• Banking details validated for DBT stipend disbursement\n• Candidate inducted for batch session 2026-2027",
          styles: { cellWidth: 105, fontSize: 7, textColor: [51, 65, 85] },
        },
        {
          content:
            "[ OFFICIALLY ENDORSED & DIGITALLY VERIFIED ]\n\nAdmissions Scrutiny Committee\nDirectorate of Handloom & Skilled Artisan Development\nAutonomous Quota Allocation System\nOfficial Enrolment Ref: " +
            (app.registration_no || "HND-2026-ENR"),
          styles: {
            fontSize: 7,
            fontStyle: "bold",
            textColor: [15, 39, 87],
            halign: "center",
            fillColor: [241, 245, 249],
          },
        },
      ],
    ],
    styles: {
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
  });

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 3;

  // 9. Section V: Mandatory Trainee Guidelines
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, pageWidth - 28, 25, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9);
  doc.text("IMPORTANT INSTRUCTIONS FOR ADMITTED ARTISAN CANDIDATE:", 17, y + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 53, 15);
  const instructions = [
    "1. Reporting Timeline: Report to the allocated Training Centre within 7 working days from notification of batch schedule.",
    "2. Document Verification: Carry this original Enrolment Slip along with original Government ID and Bank Passbook for cross-verification.",
    "3. Stipend Attendance Rule: Monthly DBT stipend disbursement requires a mandatory minimum of 80% biometric attendance.",
    "4. Official Non-transferability: This admission confirmation is non-transferable and valid solely for the allocated craft trade.",
  ];
  instructions.forEach((inst, i) => {
    doc.text(inst, 17, y + 8 + i * 4.2);
  });

  // 10. Document Footer & Security Authentication Note
  const footerY = pageHeight - 12;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, footerY - 2, pageWidth - 14, footerY - 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Handloom Project • Official Digital Admissions Confirmation Slip • Computer generated document, requires no physical seal.",
    14,
    footerY + 1.5
  );

  doc.setFont("courier", "bold");
  doc.text(`VERIFICATION HASH: ${app.id.slice(0, 12).toUpperCase()}-2026`, pageWidth - 14, footerY + 1.5, {
    align: "right",
  });

  // Trigger Download
  const cleanName = app.full_name.replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `Handloom_Project_Enrolment_${app.registration_no || app.category_code}_${cleanName}.pdf`;
  doc.save(fileName);
}

