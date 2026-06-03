const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TabStopType, TabStopPosition, TableOfContents,
} = require("docx");
const fs = require("fs");

// ── Palette ────────────────────────────────────────────────────────────────
const NAVY   = "1F3864";
const TEAL   = "0070C0";
const LIGHT  = "DEEAF1";
const HEADER = "2E75B6";
const GRAY   = "595959";
const WHITE  = "FFFFFF";
const BLACK  = "000000";

// ── Shared helpers ─────────────────────────────────────────────────────────
const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function hr() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: HEADER, space: 1 } },
    spacing: { before: 0, after: 160 },
    children: [],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, font: "Arial", size: 28, color: NAVY })],
    spacing: { before: 320, after: 160 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, font: "Arial", size: 24, color: TEAL })],
    spacing: { before: 240, after: 120 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, font: "Arial", size: 22, color: HEADER })],
    spacing: { before: 200, after: 80 },
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 22, color: GRAY, ...opts })],
    spacing: { before: 80, after: 80 },
  });
}

function bold(text) { return p(text, { bold: true, color: BLACK }); }

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text, font: "Arial", size: 22, color: GRAY })],
    spacing: { before: 40, after: 40 },
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ── Table helpers ──────────────────────────────────────────────────────────
function cell(text, opts = {}) {
  const {
    w = 2340, bold: isBold = false, header = false, shading = null,
    colspan = 1, align = AlignmentType.LEFT,
  } = opts;
  return new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    columnSpan: colspan,
    shading: shading
      ? { fill: shading, type: ShadingType.CLEAR }
      : (header ? { fill: LIGHT, type: ShadingType.CLEAR } : { fill: WHITE, type: ShadingType.CLEAR }),
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({
        text,
        font: "Arial",
        size: 20,
        bold: isBold || header,
        color: header ? NAVY : GRAY,
      })],
    })],
  });
}

function tRow(cells) { return new TableRow({ children: cells }); }

// ── Full test case table builder ───────────────────────────────────────────
const TC_WIDTHS = [800, 1000, 1500, 2200, 1800, 700, 1360];

function tcHeader() {
  const labels = ["TC-ID", "Req. Ref", "Test Description", "Test Steps", "Expected Result", "P / F", "Notes"];
  return tRow(labels.map((l, i) => cell(l, { w: TC_WIDTHS[i], header: true })));
}

function tc(id, req, desc, steps, expected, notes = "") {
  return tRow([
    cell(id,       { w: TC_WIDTHS[0] }),
    cell(req,      { w: TC_WIDTHS[1] }),
    cell(desc,     { w: TC_WIDTHS[2] }),
    cell(steps,    { w: TC_WIDTHS[3] }),
    cell(expected, { w: TC_WIDTHS[4] }),
    cell("",       { w: TC_WIDTHS[5] }),
    cell(notes,    { w: TC_WIDTHS[6] }),
  ]);
}

function tcTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: TC_WIDTHS,
    rows: [tcHeader(), ...rows],
  });
}

// ── Risk table ─────────────────────────────────────────────────────────────
const RISK_WIDTHS = [1200, 2500, 1500, 1500, 2660];

function riskRow(id, risk, likelihood, impact, mitigation, header = false) {
  const cols = [id, risk, likelihood, impact, mitigation];
  return tRow(cols.map((c, i) => cell(c, { w: RISK_WIDTHS[i], header })));
}

// ── Schedule table ─────────────────────────────────────────────────────────
const SCHED_WIDTHS = [2000, 2500, 1500, 1500, 1860];

function schedRow(phase, activity, owner, duration, dep, header = false) {
  return tRow(
    [phase, activity, owner, duration, dep].map((c, i) =>
      cell(c, { w: SCHED_WIDTHS[i], header })
    )
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DOCUMENT
// ══════════════════════════════════════════════════════════════════════════
const doc = new Document({
  creator: "Team Alpha",
  title: "HireSignal — Test Plan",
  description: "Software Test Plan for the HireSignal AI Resume Screening Platform",

  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0, format: LevelFormat.BULLET, text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
          {
            level: 1, format: LevelFormat.BULLET, text: "–",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },

  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: NAVY },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: TEAL },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: HEADER },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
      },
    ],
  },

  sections: [
    // ── Cover ──────────────────────────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 1800, after: 0 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "HireSignal", font: "Arial", size: 64, bold: true, color: NAVY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 160, after: 0 },
          children: [new TextRun({ text: "AI Resume Screening & Matching Platform", font: "Arial", size: 32, color: TEAL })],
        }),
        new Paragraph({ spacing: { before: 320, after: 0 }, children: [] }),
        hr(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "TEST PLAN", font: "Arial", size: 44, bold: true, color: HEADER })],
        }),
        hr(),
        new Paragraph({ spacing: { before: 480, after: 0 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Software Engineering | Team Alpha", font: "Arial", size: 24, color: GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 0 },
          children: [new TextRun({ text: "Version 1.0  |  June 2026", font: "Arial", size: 22, color: GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 0 },
          children: [new TextRun({ text: "Confidential — Internal Use Only", font: "Arial", size: 20, italic: true, color: "999999" })],
        }),
        pageBreak(),

        // ── TOC ─────────────────────────────────────────────────────────────
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        pageBreak(),
      ],
    },

    // ── Main content ───────────────────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "HireSignal — Test Plan", font: "Arial", size: 18, color: GRAY }),
              new TextRun({ text: "\t", font: "Arial", size: 18 }),
              new TextRun({ text: "Team Alpha | Confidential", font: "Arial", size: 18, color: GRAY }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: HEADER, space: 1 } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "Page ", font: "Arial", size: 18, color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: GRAY }),
              new TextRun({ text: " of ", font: "Arial", size: 18, color: GRAY }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 18, color: GRAY }),
            ],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      children: [

        // ══════════════════════════════════════════════════════════════════
        // 1. INTRODUCTION
        // ══════════════════════════════════════════════════════════════════
        h1("1. Introduction"),
        hr(),

        h2("1.1 Objective"),
        p("This Test Plan describes the entire testing strategy for the HireSignal platform — a full-stack AI-powered resume screening application. It covers unit testing, integration testing, end-to-end (E2E) API testing, security testing, and performance considerations. The plan identifies test requirements, tools, resource allocation, schedule, and risk mitigation."),
        p("The plan is aligned with the completed implementation as of June 2026, where all three layers (React/Vite frontend on Vercel, Node.js/Express 5 backend on Railway, and Python/FastAPI AI service on Railway) are deployed and functional."),

        h2("1.2 Project Description"),
        p("HireSignal is a MERN-stack + Python/FastAPI platform that automates resume screening for recruiters. Core capabilities:"),
        bullet("Resume parsing — PDF and DOCX files are parsed into structured candidate profiles using a custom regex + semantic scoring pipeline (no spaCy, no LLM)."),
        bullet("Semantic matching — Candidates are scored against job requirements across four weighted dimensions (Skills 40%, Experience 30%, Semantic similarity 20%, Education 10%) using the all-MiniLM-L6-v2 transformer model."),
        bullet("Role-based access control — Distinct recruiter and candidate workflows enforced via JWT authentication and RBAC middleware on every protected route."),
        bullet("Security — Short-lived access tokens (15 min, in-memory), long-lived httpOnly refresh cookies (30 days, SHA-256 hashed, rotated on use), and password reset with tokenVersion invalidation."),
        bullet("Production deployment — Frontend on Vercel, backend + AI service on Railway, MongoDB Atlas as the cloud database."),

        h2("1.3 Process Tailoring"),
        p("Given the academic project constraints (4-week timeline, 2 active contributors), the following testing approach is adopted:"),
        bullet("Unit tests are scoped to the AI service parsers (34 tests covering contact, education, and experience parsers), which are the highest-complexity components."),
        bullet("Integration and E2E testing is conducted via Postman against the live deployed API, covering all 18+ route/role combinations."),
        bullet("Frontend testing is manual — no automated UI test suite is included in scope."),
        bullet("Security testing is limited to verifying JWT flow, RBAC enforcement, and cookie attributes. Penetration testing is out of scope."),
        bullet("Performance testing covers response time benchmarks for the parsing and matching pipelines under single-user load."),

        h2("1.4 Referenced Documents"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3000, 4800, 1560],
          rows: [
            tRow([
              cell("Document", { w: 3000, header: true }),
              cell("Description", { w: 4800, header: true }),
              cell("Version", { w: 1560, header: true }),
            ]),
            tRow([cell("project_summary.md", { w: 3000 }), cell("Architecture decisions, API contracts, parser design", { w: 4800 }), cell("May 28, 2026", { w: 1560 })]),
            tRow([cell("changes_made_so_far.md", { w: 3000 }), cell("Full deployment log, feature completion record", { w: 4800 }), cell("June 1, 2026", { w: 1560 })]),
            tRow([cell("Swagger UI (/api/docs)", { w: 3000 }), cell("Live API documentation for all 18 backend routes", { w: 4800 }), cell("v1.0", { w: 1560 })]),
            tRow([cell("EXPERIENCE_PARSER_ARCHITECTURE.md", { w: 3000 }), cell("Semantic sliding-window scorer design document", { w: 4800 }), cell("May 2026", { w: 1560 })]),
          ],
        }),

        pageBreak(),

        // ══════════════════════════════════════════════════════════════════
        // 2. ASSUMPTIONS / DEPENDENCIES
        // ══════════════════════════════════════════════════════════════════
        h1("2. Assumptions / Dependencies"),
        hr(),

        h2("2.1 Assumptions"),
        bullet("All backend routes are deployed and accessible at the Railway production URL."),
        bullet("MongoDB Atlas is accepting connections from Railway IPs (0.0.0.0/0 whitelist in place)."),
        bullet("The AI service is operational and the all-MiniLM-L6-v2 model is cached at app/embedding-models/."),
        bullet("Test resumes used for parser testing are in PDF or DOCX format and do not exceed 5 MB."),
        bullet("Postman is available for API-level integration and E2E tests."),
        bullet("pytest is installed in the ai-service virtual environment for running parser unit tests."),
        bullet("RESEND_API_KEY, CONTACT_FEEDBACK_TO_EMAIL, and all JWT secrets are correctly set in Railway environment variables."),
        bullet("Browser testing is conducted in a modern Chromium-based browser (Chrome 120+)."),

        h2("2.2 Dependencies"),
        bullet("MongoDB Atlas uptime — all data-layer tests depend on Atlas connectivity."),
        bullet("Railway service uptime — backend and AI service must both be healthy (check /health endpoints)."),
        bullet("Vercel deployment — frontend tests require the production build to be live."),
        bullet("Resend API — email delivery tests (password reset, contact form) depend on the Resend service being operational."),
        bullet("HuggingFace Hub — first-run model download depends on internet access from Railway; subsequent runs use the cached model."),

        pageBreak(),

        // ══════════════════════════════════════════════════════════════════
        // 3. TEST REQUIREMENTS
        // ══════════════════════════════════════════════════════════════════
        h1("3. Test Requirements"),
        hr(),
        p("All test requirements are derived from the implemented feature set. Each requirement maps to one or more test cases in Section 9."),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [800, 2500, 4500, 1560],
          rows: [
            tRow([cell("REQ-ID",{w:800,header:true}), cell("Category",{w:2500,header:true}), cell("Requirement",{w:4500,header:true}), cell("Priority",{w:1560,header:true})]),
            tRow([cell("REQ-01",{w:800}), cell("Authentication",{w:2500}), cell("Users can register as candidate or recruiter",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-02",{w:800}), cell("Authentication",{w:2500}), cell("Login returns access token + user metadata",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-03",{w:800}), cell("Authentication",{w:2500}), cell("Access token expires after 15 minutes",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-04",{w:800}), cell("Authentication",{w:2500}), cell("Refresh token rotates on every use and expires after 30 days",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-05",{w:800}), cell("Authentication",{w:2500}), cell("Logout clears refresh token from DB and cookie",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-06",{w:800}), cell("Authentication",{w:2500}), cell("Password reset invalidates all previously issued reset tokens via tokenVersion",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-07",{w:800}), cell("RBAC",{w:2500}), cell("Candidates cannot create job postings (403)",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-08",{w:800}), cell("RBAC",{w:2500}), cell("Recruiters cannot upload resumes (403)",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-09",{w:800}), cell("RBAC",{w:2500}), cell("Unauthenticated requests to protected routes return 401",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-10",{w:800}), cell("RBAC",{w:2500}), cell("Recruiters cannot trigger match on another recruiter's job",{w:4500}), cell("Medium",{w:1560})]),
            tRow([cell("REQ-11",{w:800}), cell("Resume Parsing",{w:2500}), cell("PDF and DOCX uploads are accepted; other formats are rejected (400)",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-12",{w:800}), cell("Resume Parsing",{w:2500}), cell("Parsed profile contains name, email, skills, education, experience",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-13",{w:800}), cell("Resume Parsing",{w:2500}), cell("New upload deactivates previous resume (isActive flag)",{w:4500}), cell("Medium",{w:1560})]),
            tRow([cell("REQ-14",{w:800}), cell("Jobs",{w:2500}), cell("Candidates can apply and cancel application",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-15",{w:800}), cell("Jobs",{w:2500}), cell("GET /jobs returns cursor-paginated results",{w:4500}), cell("Medium",{w:1560})]),
            tRow([cell("REQ-16",{w:800}), cell("Jobs",{w:2500}), cell("Closed jobs cannot receive new applications",{w:4500}), cell("Medium",{w:1560})]),
            tRow([cell("REQ-17",{w:800}), cell("AI Matching",{w:2500}), cell("Match pipeline scores candidates 0.0-1.0 across 4 dimensions",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-18",{w:800}), cell("AI Matching",{w:2500}), cell("Ranked results are returned sorted best to worst",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-19",{w:800}), cell("AI Matching",{w:2500}), cell("Match results include matchedSkills and missingSkills",{w:4500}), cell("Medium",{w:1560})]),
            tRow([cell("REQ-20",{w:800}), cell("AI Matching",{w:2500}), cell("Recruiter can shortlist or un-shortlist a match result",{w:4500}), cell("Low",{w:1560})]),
            tRow([cell("REQ-21",{w:800}), cell("AI Matching",{w:2500}), cell("Match results can be exported as CSV",{w:4500}), cell("Low",{w:1560})]),
            tRow([cell("REQ-22",{w:800}), cell("Parser Unit Tests",{w:2500}), cell("Contact parser extracts name, email, phone, location",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-23",{w:800}), cell("Parser Unit Tests",{w:2500}), cell("Education parser handles degree-first and institution-first layouts",{w:4500}), cell("High",{w:1560})]),
            tRow([cell("REQ-24",{w:800}), cell("Parser Unit Tests",{w:2500}), cell("Experience parser handles 5 layout variants including no-separator",{w:4500}), cell("High",{w:1560})]),
          ],
        }),

        pageBreak(),

        // ══════════════════════════════════════════════════════════════════
        // 4. TEST TOOLS
        // ══════════════════════════════════════════════════════════════════
        h1("4. Test Tools"),
        hr(),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2200, 2500, 3500, 1160],
          rows: [
            tRow([cell("Tool",{w:2200,header:true}), cell("Purpose",{w:2500,header:true}), cell("Usage",{w:3500,header:true}), cell("Status",{w:1160,header:true})]),
            tRow([cell("pytest",{w:2200}), cell("Parser unit tests",{w:2500}), cell("Run from ai-service/: pytest app/tests/ — 34 test cases",{w:3500}), cell("Existing",{w:1160})]),
            tRow([cell("Postman",{w:2200}), cell("API integration & E2E tests",{w:2500}), cell("Collections for all 18 routes; Bearer token + cookie jar",{w:3500}), cell("Existing",{w:1160})]),
            tRow([cell("MongoDB Compass",{w:2200}), cell("Database state verification",{w:2500}), cell("Inspect collections after test runs; verify token hashing",{w:3500}), cell("Existing",{w:1160})]),
            tRow([cell("Browser DevTools",{w:2200}), cell("Cookie and network inspection",{w:2500}), cell("Verify httpOnly cookie attributes; confirm no token in localStorage",{w:3500}), cell("Existing",{w:1160})]),
            tRow([cell("Swagger UI (/api/docs)",{w:2200}), cell("API documentation & manual test",{w:2500}), cell("Mounted at https://[railway-url]/api/docs",{w:3500}), cell("Existing",{w:1160})]),
            tRow([cell("Railway Logs",{w:2200}), cell("Service health & error monitoring",{w:2500}), cell("Monitor stdout during test execution for 500 errors",{w:3500}), cell("Existing",{w:1160})]),
            tRow([cell("curl / HTTPie",{w:2200}), cell("Raw HTTP verification",{w:2500}), cell("Verify exact response shapes and HTTP status codes",{w:3500}), cell("Existing",{w:1160})]),
          ],
        }),

        pageBreak(),

        // ══════════════════════════════════════════════════════════════════
        // 5. RESOURCE REQUIREMENTS
        // ══════════════════════════════════════════════════════════════════
        h1("5. Resource Requirements"),
        hr(),
        p("See Appendix A for the detailed breakdown. Summary below."),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2500, 3000, 2000, 1860],
          rows: [
            tRow([cell("Resource",{w:2500,header:true}), cell("Role",{w:3000,header:true}), cell("Estimated Hours",{w:2000,header:true}), cell("Responsible",{w:1860,header:true})]),
            tRow([cell("S.A.",{w:2500}), cell("AI service tests, integration tests, test plan authoring",{w:3000}), cell("12 hours",{w:2000}), cell("S.A.",{w:1860})]),
            tRow([cell("C# Teammate",{w:2500}), cell("Backend route tests, Postman collection authoring",{w:3000}), cell("8 hours",{w:2000}), cell("Teammate",{w:1860})]),
            tRow([cell("Postman (SaaS)",{w:2500}), cell("API test execution and collection storage",{w:3000}), cell("N/A",{w:2000}), cell("Both",{w:1860})]),
            tRow([cell("Railway (free tier)",{w:2500}), cell("Deployed backend + AI service for E2E tests",{w:3000}), cell("N/A",{w:2000}), cell("Platform",{w:1860})]),
            tRow([cell("MongoDB Atlas (free tier)",{w:2500}), cell("Live database for integration tests",{w:3000}), cell("N/A",{w:2000}), cell("Platform",{w:1860})]),
            tRow([cell("Total",{w:2500,header:true}), cell("",{w:3000}), cell("~20 hours",{w:2000,header:true}), cell("",{w:1860})]),
          ],
        }),

        pageBreak(),

        // ══════════════════════════════════════════════════════════════════
        // 6. TEST SCHEDULE
        // ══════════════════════════════════════════════════════════════════
        h1("6. Test Schedule"),
        hr(),
        p("See Appendix B for the full Gantt chart. All testing is planned for the final project week."),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: SCHED_WIDTHS,
          rows: [
            schedRow("Phase", "Activity", "Owner", "Duration", "Dependency", true),
            schedRow("Unit Testing",    "Run pytest suite (34 tests)",              "S.A.",    "0.5 day", "ai-service deployed"),
            schedRow("Unit Testing",    "Review + fix any failing parser tests",    "S.A.",    "0.5 day", "pytest run complete"),
            schedRow("Integration",     "Build Postman auth collection",            "Both",    "0.5 day", "Backend deployed"),
            schedRow("Integration",     "Build Postman resume/jobs/match collection","Both",   "0.5 day", "Auth collection done"),
            schedRow("Integration",     "Run full Postman suite against prod",      "Both",    "1 day",   "All collections built"),
            schedRow("Security",        "JWT & cookie attribute verification",      "S.A.",    "0.5 day", "Auth integration done"),
            schedRow("Security",        "RBAC boundary testing (403/401 cases)",   "Both",    "0.5 day", "JWT test done"),
            schedRow("E2E",             "Full user journey: register -> match -> CSV","Both",  "1 day",   "Integration tests passed"),
            schedRow("Parser QA",       "Run all test resumes through /parse/",     "S.A.",    "0.5 day", "Unit tests passed"),
            schedRow("Documentation",   "Complete test plan + defect log",          "S.A.",    "0.5 day", "All tests complete"),
          ],
        }),

        pageBreak(),

        // ══════════════════════════════════════════════════════════════════
        // 7. RISKS / MITIGATION
        // ══════════════════════════════════════════════════════════════════
        h1("7. Risks / Mitigation"),
        hr(),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: RISK_WIDTHS,
          rows: [
            riskRow("RISK-ID", "Risk", "Likelihood", "Impact", "Mitigation Plan", true),
            riskRow("RSK-01", "MongoDB Atlas connection drops during test run", "Medium", "High", "Re-test after Atlas reconnect; verify 0.0.0.0/0 IP whitelist is active"),
            riskRow("RSK-02", "Railway cold-start delays cause healthcheck false failures", "High", "Low", "Warm up services before test run; increase healthcheck timeout to 600s"),
            riskRow("RSK-03", "Embedding model not cached — slow first-boot on AI service", "Medium", "Medium", "Trigger /health endpoint after deploy and wait for model load log before testing"),
            riskRow("RSK-04", "Refresh token cookie blocked by browser SameSite policy in test", "Low", "High", "Use Postman cookie jar for API tests; manual browser test for cookie attributes"),
            riskRow("RSK-05", "Resend API rate limit reached during email tests", "Low", "Medium", "Use a dedicated test email domain; batch email delivery tests to a single run"),
            riskRow("RSK-06", "Parser regressions from future config changes to parser_config.py", "Medium", "High", "All 34 unit tests must pass before any parser_config.py edit is committed"),
            riskRow("RSK-07", "VITE_API_BASE_URL misconfigured after Vercel redeploy", "Low", "High", "Verify full https:// URL in Vercel env dashboard after every redeployment"),
          ],
        }),

        pageBreak(),

        // ══════════════════════════════════════════════════════════════════
        // 8. METRICS
        // ══════════════════════════════════════════════════════════════════
        h1("8. Metrics"),
        hr(),

        h2("8.1 Pre-Shipment Metrics"),
        bullet("pytest pass rate — target 34/34 (100%) for AI service parser tests."),
        bullet("Postman collection pass rate — target 100% for all route/role combinations (including 401, 403, 400 negative cases)."),
        bullet("Defect count by category — auth, RBAC, parsing, matching, pagination, email."),
        bullet("Test coverage by requirement — each REQ-ID in Section 3 must have at least one passing test case."),
        bullet("API response time — POST /parse/ < 3s; POST /match/ < 5s for 5 candidates; GET /jobs < 500ms."),

        h2("8.2 Post-Shipment Metrics"),
        bullet("Production defect rate — defects reported on live site after final deployment."),
        bullet("Parser accuracy — percentage of test resumes with all five fields correctly extracted."),
        bullet("Match score distribution — verify scores are well-distributed across a sample of 5 candidate/job pairs."),

        pageBreak(),

        // ══════════════════════════════════════════════════════════════════
        // 9. TEST CASES
        // ══════════════════════════════════════════════════════════════════
        h1("9. Detailed Test Cases"),
        hr(),

        // ─ Auth ─────────────────────────────────────────────────────────
        h2("9.1 Authentication"),
        tcTable([
          tc("TC-AUTH-01","REQ-01","Register as candidate","POST /api/v1/auth/register with {fullName, email, password, role:'candidate'}","202 + {success:true, message:'Check your email...'}",""),
          tc("TC-AUTH-02","REQ-01","Register as recruiter","POST /api/v1/auth/register with role:'recruiter'","202 + success message",""),
          tc("TC-AUTH-03","REQ-01","Register with duplicate email","POST /api/v1/auth/register with an already-registered email","409 Conflict",""),
          tc("TC-AUTH-04","REQ-01","Register with missing fields","POST /api/v1/auth/register omitting password field","400 Validation error","Zod schema"),
          tc("TC-AUTH-05","REQ-02","Login with valid credentials","POST /api/v1/auth/login with correct email+password","200 + {accessToken, user:{_id,fullName,email,role}}",""),
          tc("TC-AUTH-06","REQ-02","Login with wrong password","POST /api/v1/auth/login with incorrect password","401 Unauthorized",""),
          tc("TC-AUTH-07","REQ-03","Access token short expiry","Decode returned JWT — check exp claim","exp - iat == 900 (15 minutes)","Use jwt.io"),
          tc("TC-AUTH-08","REQ-04","Refresh token rotation","Call POST /auth/refresh, note new accessToken; call again with old cookie","First call: 200 new token; Second call: 401","Cookie jar required"),
          tc("TC-AUTH-09","REQ-04","Refresh token in httpOnly cookie","Inspect Set-Cookie header after login","Cookie has HttpOnly; Secure; SameSite=Strict flags","Browser DevTools"),
          tc("TC-AUTH-10","REQ-05","Logout clears token","POST /auth/logout, then attempt POST /auth/refresh with same cookie","401 — token deleted from DB","Verify in Compass"),
          tc("TC-AUTH-11","REQ-06","Password reset — forgot password","POST /auth/forgot-password {email}","200 + generic message","Anti-enumeration"),
          tc("TC-AUTH-12","REQ-06","Password reset — valid token","POST /auth/reset-password {token, newPassword:'NewPass123'}","200 success; can now login with new password",""),
          tc("TC-AUTH-13","REQ-06","Password reset — reuse token","Attempt POST /auth/reset-password with same token after first successful reset","400 — tokenVersion mismatch",""),
          tc("TC-AUTH-14","REQ-06","Password reset — expired token","Use a token older than 1 hour","400 — token expired",""),
        ]),

        new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),

        // ─ RBAC ─────────────────────────────────────────────────────────
        h2("9.2 RBAC / Authorization"),
        tcTable([
          tc("TC-RBAC-01","REQ-07","Candidate cannot create job","Authenticate as candidate; POST /api/v1/jobs with valid body","403 Forbidden",""),
          tc("TC-RBAC-02","REQ-08","Recruiter cannot upload resume","Authenticate as recruiter; POST /api/v1/resumes with PDF file","403 Forbidden",""),
          tc("TC-RBAC-03","REQ-09","No token — protected route","GET /api/v1/candidates/me with no Authorization header","401 Unauthorized",""),
          tc("TC-RBAC-04","REQ-09","Expired access token","Use access token older than 15 min","401 Unauthorized",""),
          tc("TC-RBAC-05","REQ-09","Malformed Bearer token","Authorization: Bearer invalidtoken123","401 Unauthorized",""),
          tc("TC-RBAC-06","REQ-10","Recruiter triggers match on own job","Authenticate as recruiter; POST /api/v1/jobs/:ownJobId/match","200 or 202",""),
          tc("TC-RBAC-07","REQ-10","Recruiter triggers match on another recruiter's job","Register two recruiters; recruiter B calls POST /jobs/:recruiterAJobId/match","403 Forbidden",""),
        ]),

        new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),

        // ─ Resume ────────────────────────────────────────────────────────
        h2("9.3 Resume Upload & Parsing"),
        tcTable([
          tc("TC-RES-01","REQ-11","Upload valid PDF","POST /api/v1/resumes with multipart PDF file (< 5MB)","201 + parsedData object",""),
          tc("TC-RES-02","REQ-11","Upload valid DOCX","POST /api/v1/resumes with multipart DOCX file","201 + parsedData object",""),
          tc("TC-RES-03","REQ-11","Upload unsupported format","POST /api/v1/resumes with .txt file","400 — unsupported file type",""),
          tc("TC-RES-04","REQ-11","Upload file exceeding 5MB","POST /api/v1/resumes with PDF > 5242880 bytes","400 — file too large",""),
          tc("TC-RES-05","REQ-12","Parsed profile completeness","Upload known test resume; GET /api/v1/candidates/me","Response contains skills[], education[], experience.entries[], yearsExperience","Use Lena or Emeka test PDF"),
          tc("TC-RES-06","REQ-13","Second upload deactivates first","Upload two resumes for same candidate; query Resume collection","Only latest has isActive: true","Verify in Compass"),
          tc("TC-RES-07","REQ-12","CandidateProfile upserted","Upload resume; check CandidateProfile collection","Profile exists with correct userId, skills, educationLevel",""),
        ]),

        new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),

        // ─ Jobs ──────────────────────────────────────────────────────────
        h2("9.4 Job Requirements & Applications"),
        tcTable([
          tc("TC-JOB-01","REQ-14","Create job posting","POST /api/v1/jobs with {title, description, requiredSkills, requiredExperienceYears, requiredEducationLevel}","201 + job object with _id","Recruiter auth"),
          tc("TC-JOB-02","REQ-14","List jobs","GET /api/v1/jobs","200 + {items[], nextCursor, hasMore}",""),
          tc("TC-JOB-03","REQ-15","Cursor pagination — first page","GET /api/v1/jobs?limit=2","items.length == 2, hasMore:true (if >2 jobs), nextCursor not null","Requires 3+ jobs"),
          tc("TC-JOB-04","REQ-15","Cursor pagination — next page","GET /api/v1/jobs?limit=2&cursor=<nextCursor from TC-JOB-03>","Next 2 jobs returned; no overlap with first page",""),
          tc("TC-JOB-05","REQ-14","Apply to job","POST /api/v1/jobs/:jobId/apply as candidate","201 Application created",""),
          tc("TC-JOB-06","REQ-14","Duplicate application rejected","POST /api/v1/jobs/:jobId/apply twice with same candidate","409 — already applied",""),
          tc("TC-JOB-07","REQ-14","Cancel application","DELETE /api/v1/jobs/:jobId/apply","200 — application removed",""),
          tc("TC-JOB-08","REQ-16","Close job","PATCH /api/v1/jobs/:jobId {isOpen:false}; then POST /api/v1/jobs/:jobId/apply","400 or 409 — job is closed","Recruiter closes, candidate applies"),
        ]),

        new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),

        // ─ AI Matching ───────────────────────────────────────────────────
        h2("9.5 AI Matching Pipeline"),
        tcTable([
          tc("TC-MATCH-01","REQ-17","Trigger match","POST /api/v1/jobs/:jobId/match as recruiter (job has 1+ applicants)","200 + rankedCandidates[]","Requires TC-RES-01 + TC-JOB-05 done"),
          tc("TC-MATCH-02","REQ-17","Score range validation","Inspect each candidate's totalScore in match result","0.0 <= totalScore <= 1.0",""),
          tc("TC-MATCH-03","REQ-17","Score breakdown present","Inspect scoreBreakdown in match result","Contains skills, experience, semantic, education keys",""),
          tc("TC-MATCH-04","REQ-18","Results sorted by score","GET /api/v1/jobs/:jobId/matches","rankedPosition increases monotonically; first result has highest totalScore",""),
          tc("TC-MATCH-05","REQ-19","matchedSkills and missingSkills","Inspect any match result","matchedSkills and missingSkills are arrays of strings",""),
          tc("TC-MATCH-06","REQ-19","AI explanation present","Inspect match result","explanation field is non-empty string",""),
          tc("TC-MATCH-07","REQ-20","Shortlist candidate","PATCH /api/v1/jobs/:jobId/matches/:matchId {shortlisted:true}","200 + updated matchResult with shortlisted:true",""),
          tc("TC-MATCH-08","REQ-20","Un-shortlist candidate","PATCH /api/v1/jobs/:jobId/matches/:matchId {shortlisted:false}","200 + shortlisted:false",""),
          tc("TC-MATCH-09","REQ-21","Export CSV","GET /api/v1/jobs/:jobId/matches/export.csv","200 text/csv; rows contain candidateName, totalScore, rankedPosition",""),
          tc("TC-MATCH-10","REQ-15","Match results pagination","GET /api/v1/jobs/:jobId/matches?limit=2","Cursor-paginated; sorted by rankedPosition ASC",""),
        ]),

        new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),

        // ─ Parser Unit Tests ────────────────────────────────────────────
        h2("9.6 Parser Unit Tests (pytest)"),
        tcTable([
          tc("TC-PARSE-01","REQ-22","Contact: standard name extraction","Run test_contact_parser.py — test_name_standard_header","Name correctly extracted from 'John Doe' header line","pytest"),
          tc("TC-PARSE-02","REQ-22","Contact: title line not treated as name","Run test — test_name_not_job_title","'Software Engineer' header does not produce a name","pytest"),
          tc("TC-PARSE-03","REQ-22","Contact: email extraction","Run test — test_email_standard","Email correctly extracted from standard format","pytest"),
          tc("TC-PARSE-04","REQ-22","Contact: international phone","Run test — test_phone_international","Phone with country code correctly extracted","pytest"),
          tc("TC-PARSE-05","REQ-22","Contact: location extraction","Run test — test_location_city_country","'Lagos, Nigeria' correctly parsed as location","pytest"),
          tc("TC-PARSE-06","REQ-22","Contact: zero-width char stripping","Run test — test_zero_width_stripping","\\u200b in line does not break name/email extraction","pytest"),
          tc("TC-PARSE-07","REQ-23","Education: degree-first layout","Run test_education_parser.py — test_degree_first","Degree on line 1, institution on line 2 — both extracted","pytest"),
          tc("TC-PARSE-08","REQ-23","Education: institution-first layout","Run test — test_institution_first","Institution on line 1, degree on line 2 — both extracted","pytest"),
          tc("TC-PARSE-09","REQ-23","Education: same-line degree + institution","Run test — test_same_line_separator","Degree and institution on one line both extracted","pytest"),
          tc("TC-PARSE-10","REQ-23","Education: year range extraction","Run test — test_date_range_bare_years","'2018 - 2022' → start_year:2018, end_year:2022","pytest"),
          tc("TC-PARSE-11","REQ-23","Education: month-name date range","Run test — test_date_range_month_names","'September 2018 - June 2022' correctly parsed","pytest"),
          tc("TC-PARSE-12","REQ-23","Education: GPA line stripping","Run test — test_grade_line_stripping","GPA or percentage line does not bleed into degree field","pytest"),
          tc("TC-PARSE-13","REQ-23","Education: level mapping","Run test — test_education_level_mapping","'Bachelor of Science' → 'bachelor'; 'Master of Arts' → 'master'","pytest"),
          tc("TC-PARSE-14","REQ-24","Experience: explicit separator","Run test_experience_parser.py — test_explicit_pipe_separator","'Software Engineer | Accenture' → role and company","pytest"),
          tc("TC-PARSE-15","REQ-24","Experience: em-dash separator","Run test — test_emdash_separator","'Product Manager — Google' correctly split","pytest"),
          tc("TC-PARSE-16","REQ-24","Experience: company suffix no separator","Run test — test_no_separator_company_suffix","'Graduate Accountant PricewaterhouseCoopers Lagos' — both extracted","pytest"),
          tc("TC-PARSE-17","REQ-24","Experience: parenthetical annotation","Run test — test_parenthetical_annotation","'Junior Developer (Contract) Cowrywise, Remote' → role and company correct","pytest"),
          tc("TC-PARSE-18","REQ-24","Experience: multi-word role no casing","Run test — test_multiword_role_no_casing","'Data Analyst Intern Stanbic IBTC Bank' correctly split","pytest"),
        ]),

        new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),

        // ─ Contact Form ─────────────────────────────────────────────────
        h2("9.7 Contact Form"),
        tcTable([
          tc("TC-CONT-01","N/A","Submit contact form","POST /api/v1/contact {name, email, message} — all fields","200 + success message; email delivered to CONTACT_FEEDBACK_TO_EMAIL","Check inbox"),
          tc("TC-CONT-02","N/A","Rate limit enforcement","Submit 4 contact form requests within 1 minute from same IP","4th request: 429 Too Many Requests","Rate: 3/min"),
          tc("TC-CONT-03","N/A","Missing required field","POST /api/v1/contact with no message field","400 Validation error",""),
        ]),

        pageBreak(),

        // ══════════════════════════════════════════════════════════════════
        // APPENDIX A — Detailed Resource Requirements
        // ══════════════════════════════════════════════════════════════════
        h1("Appendix A — Detailed Resource Requirements"),
        hr(),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2200, 3000, 1800, 1200, 1160],
          rows: [
            tRow([
              cell("Activity", { w: 2200, header: true }),
              cell("Description", { w: 3000, header: true }),
              cell("Owner", { w: 1800, header: true }),
              cell("Hours", { w: 1200, header: true }),
              cell("Tool", { w: 1160, header: true }),
            ]),
            tRow([cell("Parser unit test run", {w:2200}), cell("Execute all 34 pytest cases, review failures", {w:3000}), cell("S.A.", {w:1800}), cell("2h", {w:1200}), cell("pytest", {w:1160})]),
            tRow([cell("Parser test fix cycle", {w:2200}), cell("Debug and fix any failing tests (regression guard)", {w:3000}), cell("S.A.", {w:1800}), cell("2h", {w:1200}), cell("pytest / VS Code", {w:1160})]),
            tRow([cell("Postman auth collection", {w:2200}), cell("Build & run 14 auth test cases (TC-AUTH-01 to -14)", {w:3000}), cell("Both", {w:1800}), cell("2h", {w:1200}), cell("Postman", {w:1160})]),
            tRow([cell("Postman RBAC collection", {w:2200}), cell("Build & run 7 RBAC test cases (TC-RBAC-01 to -07)", {w:3000}), cell("Both", {w:1800}), cell("1h", {w:1200}), cell("Postman", {w:1160})]),
            tRow([cell("Postman resume/jobs/match", {w:2200}), cell("Build & run 25+ API integration tests", {w:3000}), cell("Both", {w:1800}), cell("3h", {w:1200}), cell("Postman", {w:1160})]),
            tRow([cell("Security verification", {w:2200}), cell("JWT expiry, cookie flags, RBAC 403/401 checks", {w:3000}), cell("S.A.", {w:1800}), cell("1h", {w:1200}), cell("DevTools / Postman", {w:1160})]),
            tRow([cell("E2E user journey", {w:2200}), cell("Full flow: register → upload → apply → match → CSV export", {w:3000}), cell("Both", {w:1800}), cell("2h", {w:1200}), cell("Postman + Browser", {w:1160})]),
            tRow([cell("Parser QA with real resumes", {w:2200}), cell("Upload 5 real-format PDFs; verify parsedData quality", {w:3000}), cell("S.A.", {w:1800}), cell("1h", {w:1200}), cell("Postman / Compass", {w:1160})]),
            tRow([cell("Test plan documentation", {w:2200}), cell("Author and review this test plan document", {w:3000}), cell("S.A.", {w:1800}), cell("3h", {w:1200}), cell("Word / docx", {w:1160})]),
            tRow([cell("Defect log maintenance", {w:2200}), cell("Record and track defects discovered during test runs", {w:3000}), cell("Both", {w:1800}), cell("1h", {w:1200}), cell("GitHub Issues", {w:1160})]),
            tRow([cell("TOTAL", {w:2200, header:true}), cell("", {w:3000}), cell("", {w:1800}), cell("~18-20h", {w:1200, header:true}), cell("", {w:1160})]),
          ],
        }),

        pageBreak(),

        // ══════════════════════════════════════════════════════════════════
        // APPENDIX B — Schedule (Gantt)
        // ══════════════════════════════════════════════════════════════════
        h1("Appendix B — Test Schedule (Gantt View)"),
        hr(),
        p("All testing occurs in Week 4 of the project timeline (final week). The schedule below maps activities to specific days."),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 1300, 1300, 1300, 1300, 1300, 1160],
          rows: [
            tRow([
              cell("Activity", { w: 2400, header: true }),
              cell("Mon", { w: 1300, header: true }),
              cell("Tue", { w: 1300, header: true }),
              cell("Wed", { w: 1300, header: true }),
              cell("Thu", { w: 1300, header: true }),
              cell("Fri", { w: 1300, header: true }),
              cell("Owner", { w: 1160, header: true }),
            ]),
            tRow([cell("pytest unit tests (34 cases)",{w:2400}), cell("●●●",{w:1300}), cell("",{w:1300}), cell("",{w:1300}), cell("",{w:1300}), cell("",{w:1300}), cell("S.A.",{w:1160})]),
            tRow([cell("Postman auth + RBAC collection",{w:2400}), cell("●●●",{w:1300}), cell("●●●",{w:1300}), cell("",{w:1300}), cell("",{w:1300}), cell("",{w:1300}), cell("Both",{w:1160})]),
            tRow([cell("Postman resume/jobs/match",{w:2400}), cell("",{w:1300}), cell("●●●",{w:1300}), cell("●●●",{w:1300}), cell("",{w:1300}), cell("",{w:1300}), cell("Both",{w:1160})]),
            tRow([cell("Security & JWT verification",{w:2400}), cell("",{w:1300}), cell("",{w:1300}), cell("●●●",{w:1300}), cell("",{w:1300}), cell("",{w:1300}), cell("S.A.",{w:1160})]),
            tRow([cell("E2E user journey test",{w:2400}), cell("",{w:1300}), cell("",{w:1300}), cell("",{w:1300}), cell("●●●",{w:1300}), cell("",{w:1300}), cell("Both",{w:1160})]),
            tRow([cell("Parser QA with real resumes",{w:2400}), cell("",{w:1300}), cell("",{w:1300}), cell("",{w:1300}), cell("●●●",{w:1300}), cell("",{w:1300}), cell("S.A.",{w:1160})]),
            tRow([cell("Defect log & test plan finalization",{w:2400}), cell("",{w:1300}), cell("",{w:1300}), cell("",{w:1300}), cell("",{w:1300}), cell("●●●",{w:1300}), cell("S.A.",{w:1160})]),
          ],
        }),

        new Paragraph({ spacing: { before: 160, after: 80 }, children: [] }),
        p("Legend: ●●● = activity scheduled for this day. Activities may overlap."),

        pageBreak(),

        // ══════════════════════════════════════════════════════════════════
        // APPENDIX C — Defect Log Template
        // ══════════════════════════════════════════════════════════════════
        h1("Appendix C — Defect Log Template"),
        hr(),
        p("Defects discovered during test execution should be logged using the template below and tracked as GitHub Issues in the AI-Resume-Screener repository."),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [800, 1200, 1600, 1600, 1200, 1200, 1760],
          rows: [
            tRow([
              cell("DEF-ID", { w: 800, header: true }),
              cell("TC-ID", { w: 1200, header: true }),
              cell("Description", { w: 1600, header: true }),
              cell("Steps to Reproduce", { w: 1600, header: true }),
              cell("Severity", { w: 1200, header: true }),
              cell("Status", { w: 1200, header: true }),
              cell("Resolution", { w: 1760, header: true }),
            ]),
            tRow([cell("DEF-001",{w:800}), cell("TC-AUTH-08",{w:1200}), cell("Refresh cookie not rotated after second call",{w:1600}), cell("Login → /auth/refresh → /auth/refresh with same cookie",{w:1600}), cell("Critical",{w:1200}), cell("Open",{w:1200}), cell("",{w:1760})]),
            tRow([cell("DEF-002",{w:800}), cell("",{w:1200}), cell("",{w:1600}), cell("",{w:1600}), cell("",{w:1200}), cell("",{w:1200}), cell("",{w:1760})]),
            tRow([cell("DEF-003",{w:800}), cell("",{w:1200}), cell("",{w:1600}), cell("",{w:1600}), cell("",{w:1200}), cell("",{w:1200}), cell("",{w:1760})]),
          ],
        }),

        new Paragraph({ spacing: { before: 160, after: 80 }, children: [] }),
        p("Severity levels: Critical (blocks testing), High (functional failure), Medium (partial failure), Low (cosmetic/minor)."),
      ],
    },
  ],
});

// ── Write output ───────────────────────────────────────────────────────────
Packer.toBuffer(doc).then((buffer) => {
  const outputPath = "C:/Users/HP/Documents/MyWorks/Projects/AI-Resume-Screener/extras/HireSignal-TestPlan.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log("Done -> " + outputPath);
}).catch(console.error);
