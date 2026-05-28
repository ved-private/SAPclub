import { useState } from "react";

/* ── ALL SAP MODULES DATA (from PDF) ─────────────────── */
const SAP_MODULES = [
  {
    id: "FI",
    label: "  FI",
    fullName: "Financial Accounting",
    emoji: "💰",
    tagline: "The money brain of SAP",
    color: "#058d37",
    glow: "rgba(8, 184, 52, 0.3)",
    difficulty: 4,
    jobDemand: 5,
    topics: [
      {
        id: "fi-gl", title: "General Ledger (G/L)",
        overview: "General Ledger is the central repository of all financial transactions in SAP FI. It acts as the backbone of financial accounting — every business event that has a monetary impact gets recorded here. The G/L provides a complete picture of a company's financial position at any point in time.",
        whyItExists: "SAP introduced G/L to eliminate manual bookkeeping errors, ensure real-time financial visibility, and provide a single source of truth for all financial data across departments.",
        howItWorks: "When any financial transaction occurs (e.g., a sale, purchase, or payroll run), SAP automatically posts entries to the G/L using double-entry accounting. The system validates entries, checks budgets, and updates balances in real time.",
        keyAreas: ["Chart of Accounts (COA)", "Posting periods & fiscal years", "Document types & number ranges", "Parallel ledgers (New G/L)", "T-Code: FB50, FS00, F-02"],
        careerNote: "G/L knowledge is the #1 requirement for any SAP FI role. It's tested in every FI certification exam and asked in every SAP finance interview."
      },
      {
        id: "fi-ap", title: "Accounts Payable (AP)",
        overview: "AP manages all outgoing payments to vendors. It tracks what a company owes to its suppliers, automates payment runs, and ensures that invoices are matched to purchase orders before payment.",
        whyItExists: "To standardize vendor payment processes, prevent duplicate payments, enable early payment discounts, and maintain vendor relationships through timely and accurate settlements.",
        howItWorks: "The AP process flow: Vendor Invoice → Invoice Verification → Approval → Automatic Payment Program (APP) → Payment to Vendor → Clearing. Integration with MM module for 3-way matching (PO + GR + Invoice).",
        keyAreas: ["Vendor master data", "Invoice posting (FB60)", "Automatic Payment Program (F110)", "Down payments", "Vendor reconciliation accounts", "T-Code: FK01, FB60, F110"],
        careerNote: "AP is one of the highest-demand SAP FI sub-modules in banking, manufacturing, and retail sectors. Expertise in APP (F110) is a key differentiator."
      },
      {
        id: "fi-ar", title: "Accounts Receivable (AR)",
        overview: "AR manages all incoming payments from customers. It tracks what customers owe to the company, automates dunning (payment reminders), and provides aging reports for cash flow management.",
        whyItExists: "To accelerate cash collection, reduce bad debts, automate customer statements, and provide real-time visibility into outstanding receivables.",
        howItWorks: "Sales Order → Billing Document → Customer Invoice posted in AR → Payment received → Clearing. The dunning program automatically sends payment reminders based on configured levels.",
        keyAreas: ["Customer master data", "Invoice posting (FB70)", "Dunning program (F150)", "Credit management integration", "Incoming payment processing (F-28)", "T-Code: FD01, FB70, F-28, F150"],
        careerNote: "AR expertise is crucial for companies with large customer bases. Dunning configuration and credit management integration are premium skills."
      },
      {
        id: "fi-aa", title: "Asset Accounting",
        overview: "Asset Accounting (FI-AA) manages the complete lifecycle of fixed assets — from acquisition to retirement. It handles depreciation, asset transfers, and provides accurate asset values for balance sheets.",
        whyItExists: "Companies need accurate tracking of thousands of assets for tax compliance, insurance, audit purposes, and strategic planning. Manual tracking is error-prone and time-consuming.",
        howItWorks: "Asset Master Record is created → Asset is acquired (purchase/internal construction) → Depreciation runs monthly/annually → Asset can be transferred or retired. Multiple depreciation areas run in parallel for different reporting needs (GAAP, tax, IFRS).",
        keyAreas: ["Asset master data (AS01)", "Depreciation keys & methods", "Asset acquisition & retirement", "Parallel depreciation areas", "Year-end closing (AJAB)", "T-Code: AS01, AFAB, AW01N"],
        careerNote: "FI-AA is mandatory for manufacturing and infrastructure companies. IFRS 16 (lease accounting) has made this module even more critical in recent years."
      },
      {
        id: "fi-ba", title: "Bank Accounting",
        overview: "Bank Accounting manages all bank-related transactions including bank statement processing, electronic bank reconciliation, and cash position monitoring.",
        whyItExists: "To automate bank statement processing, eliminate manual reconciliation errors, and provide real-time cash position visibility for treasury management.",
        howItWorks: "Electronic Bank Statement (EBS) is imported → SAP automatically matches bank entries with open items → Unmatched items are posted manually → Bank reconciliation statement is generated.",
        keyAreas: ["Bank master data configuration", "Electronic Bank Statement (MT940)", "Manual Bank Statement (FF67)", "Bank reconciliation", "House banks & bank accounts", "T-Code: FF67, FF_5, FEBP"],
        careerNote: "Bank Accounting is increasingly important with SAP S/4HANA's advanced bank reconciliation capabilities. Required for treasury and finance transformation projects."
      },
    ]
  },
  {
    id: "CO",
    label: "  CO",
    fullName: "Controlling",
    emoji: "📊",
    tagline: "The profit compass of SAP",
    color: "#00E5A0",
    glow: "rgba(0,229,160,0.3)",
    difficulty: 4,
    jobDemand: 4,
    topics: [
      {
        id: "co-cca", title: "Cost Center Accounting",
        overview: "Cost Center Accounting tracks where costs are incurred within an organization. Cost centers represent departments, functions, or geographical areas that consume resources but don't directly generate revenue.",
        whyItExists: "Management needs to know which departments are spending how much, to control budgets, allocate costs fairly, and optimize resource utilization.",
        howItWorks: "Costs are posted to cost centers via primary cost postings (from FI) or secondary allocations. At period end, costs are assessed or distributed to other cost objects using cycles.",
        keyAreas: ["Cost center master data (KS01)", "Cost element accounting", "Planning vs actuals", "Assessment & distribution cycles", "Internal activity allocation", "T-Code: KS01, KB11N, KSV5"],
        careerNote: "CCA is the foundation of SAP CO. Every SAP controlling consultant must master this module — it appears in 90% of CO job descriptions."
      },
      {
        id: "co-pca", title: "Profit Center Accounting",
        overview: "Profit Center Accounting (EC-PCA) treats business units as mini profit-and-loss entities, allowing management to evaluate profitability at a segment level.",
        whyItExists: "Companies need to know which product lines, regions, or divisions are profitable and which are dragging down performance — without waiting for year-end consolidation.",
        howItWorks: "Every balance sheet and P&L item is assigned to a profit center. In S/4HANA, profit centers are mandatory. The system provides real-time P&L by segment.",
        keyAreas: ["Profit center master data (KE51)", "Profit center hierarchy", "Transfer pricing", "Profit center planning", "Segment reporting (IFRS 8)", "T-Code: KE51, KE5Z, S_ALR_87013336"],
        careerNote: "With S/4HANA making profit centers mandatory, PCA expertise is now essential for all modern SAP implementations."
      },
      {
        id: "co-io", title: "Internal Orders",
        overview: "Internal Orders are used to track costs for specific events, projects, or activities that are temporary in nature — like a marketing campaign, a repair job, or a company event.",
        whyItExists: "Sometimes costs need to be tracked for a specific purpose that doesn't fit neatly into cost centers or projects. Internal orders provide flexible, temporary cost collectors.",
        howItWorks: "Internal Order is created → Costs are collected → Budget can be set with availability control → At the end, costs are settled to cost centers, assets, or projects.",
        keyAreas: ["Order types & master data (KO01)", "Budget & availability control", "Settlement rules & profiles", "Order settlement (KO88)", "Statistical vs real orders", "T-Code: KO01, KO88, KOB1"],
        careerNote: "Internal Orders are widely used in service industries, public sector, and for CAPEX tracking. Settlement configuration is a key interview topic."
      },
      {
        id: "co-pc", title: "Product Costing",
        overview: "Product Costing calculates the cost to manufacture a product, enabling companies to set profitable prices, value inventory correctly, and identify cost reduction opportunities.",
        whyItExists: "Without accurate product costs, companies either overprice (losing customers) or underprice (losing money). Product costing provides the data for informed pricing decisions.",
        howItWorks: "Cost estimate is created using BOM + Routing → Standard cost is released → Actual costs are collected during production → Variance analysis compares standard vs actual.",
        keyAreas: ["Cost estimate with quantity structure (CK11N)", "Standard cost release (CK24)", "Actual costing / Material Ledger", "WIP calculation", "Variance analysis", "T-Code: CK11N, CK24, CO88"],
        careerNote: "Product Costing is the most technically complex CO module. Consultants with this expertise command premium salaries in manufacturing sectors."
      },
      {
        id: "co-copa", title: "Profitability Analysis (CO-PA)",
        overview: "CO-PA analyzes profitability by market segments — products, customers, regions, sales channels. It's the bridge between sales performance and financial results.",
        whyItExists: "Management needs multidimensional profitability views to understand which customers, products, or markets are truly profitable after all costs are considered.",
        howItWorks: "Billing documents and cost allocations flow into CO-PA automatically. Characteristics (e.g., customer, product, region) and value fields (revenue, costs, margins) are configured. Reports show contribution margin by any combination.",
        keyAreas: ["Costing-based vs Account-based PA", "Characteristics & value fields", "PA transfer structures", "Top-down distribution", "Profitability reports (KE30)", "T-Code: KE24, KE30, KEA0"],
        careerNote: "CO-PA is in extremely high demand for S/4HANA projects. Account-based CO-PA (the S/4HANA default) is a specialized skill with very few experts available."
      },
    ]
  },
  {
    id: "MM",
    label: "  MM",
    fullName: "Materials Management",
    emoji: "📦",
    tagline: "The supply chain engine",
    color: "#FFB800",
    glow: "rgba(255,184,0,0.3)",
    difficulty: 3,
    jobDemand: 5,
    topics: [
      {
        id: "mm-pr", title: "Purchase Requisition",
        overview: "A Purchase Requisition (PR) is an internal document that signals the need to procure goods or services. It's the starting point of the procure-to-pay cycle.",
        whyItExists: "To create a formal, traceable request for procurement that can be approved, tracked, and converted to a purchase order — replacing informal verbal or email requests.",
        howItWorks: "User creates PR (ME51N) → PR goes through approval workflow → Purchasing converts approved PR to Purchase Order → PR is marked as 'ordered'.",
        keyAreas: ["PR creation (ME51N)", "PR approval workflow", "Source of supply determination", "MRP-generated PRs", "Account assignment categories", "T-Code: ME51N, ME52N, ME53N"],
        careerNote: "Understanding PR-to-PO conversion and approval workflows is fundamental for any MM consultant. It's asked in every MM interview."
      },
      {
        id: "mm-po", title: "Purchase Order",
        overview: "A Purchase Order (PO) is the formal, legally binding document sent to a vendor to procure specific goods or services at agreed terms, quantities, and prices.",
        whyItExists: "To establish a legal contract with vendors, ensure price and quantity commitments, and provide a reference document for goods receipt and invoice verification.",
        howItWorks: "PO is created (ME21N) from PR or directly → Sent to vendor → Vendor delivers goods → Goods Receipt references PO → Invoice is verified against PO.",
        keyAreas: ["PO types (Standard, Subcontracting, Scheduling Agreement)", "Pricing conditions", "Account assignment", "Release (approval) strategy", "PO output & transmission", "T-Code: ME21N, ME22N, ME2M"],
        careerNote: "PO creation, release strategies, and output configuration are core MM skills. Scheduling Agreements and Outline Agreements are advanced topics that differentiate consultants."
      },
      {
        id: "mm-gr", title: "Goods Receipt",
        overview: "Goods Receipt (GR) is the process of physically receiving goods from a vendor and recording that receipt in SAP, which triggers inventory increase and financial postings.",
        whyItExists: "To formally acknowledge receipt of ordered goods, update inventory levels accurately, create accounting documents, and provide the basis for invoice verification.",
        howItWorks: "Delivery arrives → Warehouse staff does GR with reference to PO (MIGO) → Stock increases → Financial document created (inventory debit, GR/IR credit) → PO history updated.",
        keyAreas: ["GR with PO reference (MIGO)", "GR/IR clearing account", "Movement types (101, 122, etc.)", "Quality inspection stock", "Partial deliveries & over-delivery", "T-Code: MIGO, MB51, MMBE"],
        careerNote: "Understanding GR's financial impact and movement types is essential. The GR/IR account reconciliation is a classic interview and project challenge."
      },
      {
        id: "mm-iv", title: "Invoice Verification",
        overview: "Invoice Verification (LIV - Logistics Invoice Verification) matches vendor invoices against Purchase Orders and Goods Receipts to ensure accuracy before payment.",
        whyItExists: "To prevent overpayment, catch billing errors, enforce 3-way matching (PO + GR + Invoice), and ensure only legitimate invoices are paid.",
        howItWorks: "Vendor invoice received → Entered in SAP (MIRO) → System checks: PO price, GR quantity, tolerance limits → If matched: invoice posted, payment due → If variance: blocked for review.",
        keyAreas: ["3-way matching concept", "Invoice posting (MIRO)", "Tolerance keys & limits", "Blocked invoices (MRBR)", "ERS (Evaluated Receipt Settlement)", "T-Code: MIRO, MRBR, MR8M"],
        careerNote: "LIV expertise is critical for AP and MM integration roles. ERS configuration and blocked invoice management are high-value skills."
      },
      {
        id: "mm-im", title: "Inventory Management",
        overview: "Inventory Management tracks the quantity and value of materials at all stages — from goods receipt to goods issue — across all storage locations and plants.",
        whyItExists: "Accurate inventory data is critical for production planning, financial reporting, customer commitments, and preventing stockouts or excess inventory costs.",
        howItWorks: "Every material movement (receipt, issue, transfer) creates a material document and (usually) a financial document. Inventory valuation methods (Moving Average, Standard Price) determine stock values.",
        keyAreas: ["Movement types & their impact", "Stock types (unrestricted, quality, blocked)", "Physical inventory process (MI01)", "Inventory valuation methods", "Stock overview (MMBE)", "T-Code: MIGO, MI01, MI07, MMBE"],
        careerNote: "Deep knowledge of movement types and valuation is what separates junior from senior MM consultants. Physical inventory process is important for year-end projects."
      },
      {
        id: "mm-mrp", title: "MRP (Material Requirements Planning)",
        overview: "MRP automatically calculates what materials are needed, in what quantities, and by when — based on demand from sales orders, production orders, and independent requirements.",
        whyItExists: "Manual planning of thousands of materials across multiple plants is impossible. MRP automates procurement and production planning to ensure materials are available when needed.",
        howItWorks: "MRP takes demand (sales orders, forecasts) → Checks available stock and supply orders → Calculates net requirements → Creates procurement proposals (PRs for buying, planned orders for production).",
        keyAreas: ["MRP types (MRP, Consumption-based)", "Planning strategies", "MRP run (MD01, MD02)", "Exception messages", "Lot sizing procedures", "T-Code: MD01, MD02, MD04, MD06"],
        careerNote: "MRP configuration is a specialized skill. Consultants who understand MRP types, planning strategies, and lot sizing are in high demand for manufacturing projects."
      },
    ]
  },
  {
    id: "SD",
    label: "  SD",
    fullName: "Sales & Distribution",
    emoji: "🚀",
    tagline: "From order to cash",
    color: "#A78BFA",
    glow: "rgba(167,139,250,0.3)",
    difficulty: 3,
    jobDemand: 5,
    topics: [
      { id: "sd-sop", title: "Sales Order Processing", overview: "Sales Order Processing is the core of SAP SD. It captures customer orders with all relevant details — material, quantity, price, delivery date, and terms.", whyItExists: "To create a formal record of customer commitments that drives all downstream processes: availability check, delivery, billing, and financial posting.", howItWorks: "Customer places order → Sales Order created (VA01) → Availability check → Pricing determined → Credit check → Delivery created → Goods issue → Billing.", keyAreas: ["Order types (OR, CS, etc.)", "Partner functions", "Availability check (ATP)", "Schedule lines", "Incompletion log", "T-Code: VA01, VA02, VA05"], careerNote: "Sales Order configuration is the core SD skill. Understanding the order-to-cash cycle end-to-end is mandatory for any SD role." },
      { id: "sd-pr", title: "Pricing", overview: "SAP SD Pricing uses a condition technique to automatically determine prices, discounts, surcharges, freight, and taxes on every sales document.", whyItExists: "Complex pricing rules (customer-specific prices, volume discounts, seasonal promotions) cannot be managed manually. SAP's condition technique provides flexible, automated pricing.", howItWorks: "Pricing procedure is assigned to sales document → System searches condition tables in sequence → Finds applicable price, discount, tax records → Calculates net price.", keyAreas: ["Condition types & tables", "Pricing procedures", "Access sequences", "Condition records (VK11)", "Rebate processing", "T-Code: VK11, VK12, V/06"], careerNote: "Pricing configuration is the most complex SD topic. Rebate processing and condition technique mastery are premium skills." },
      { id: "sd-del", title: "Delivery", overview: "The delivery document in SAP SD triggers the physical movement of goods from the warehouse to the customer.", whyItExists: "A formal delivery document enables warehouse planning, picking, packing, and goods issue — all controlled and trackable.", howItWorks: "Delivery created from sales order (VL01N) → Picking (warehouse picks goods) → Packing → Goods Issue posted → Stock reduced → Billing can now happen.", keyAreas: ["Outbound delivery (VL01N)", "Picking & packing", "Goods Issue (VL02N)", "Partial deliveries", "Shipping points & routes", "T-Code: VL01N, VL02N, VL06O"], careerNote: "Delivery and shipping configuration is essential for logistics-heavy implementations. Integration with WM/EWM for complex warehousing is advanced." },
      { id: "sd-bil", title: "Billing", overview: "Billing creates the invoice that is sent to the customer and posts the revenue and receivables in Financial Accounting.", whyItExists: "Billing is the final step in order-to-cash — it's how the company formally requests payment and records revenue.", howItWorks: "Billing due list populated after GI → Billing document created (VF01) → Revenue posted to FI (customer debit, revenue credit) → Invoice sent to customer.", keyAreas: ["Billing types & document flow", "Billing due list (VF04)", "Revenue account determination", "Intercompany billing", "Proforma invoices", "T-Code: VF01, VF02, VF04"], careerNote: "Billing configuration including revenue account determination is critical. Intercompany billing is a specialized topic for large enterprises." },
      { id: "sd-cm", title: "Credit Management", overview: "Credit Management automatically checks a customer's creditworthiness before allowing orders or deliveries, protecting the company from bad debt.", whyItExists: "Without credit checks, sales teams may over-commit to customers who can't pay, leading to significant bad debt losses.", howItWorks: "Credit limit set for customer → On sales order save, credit check runs → If limit exceeded: order blocked → Credit manager reviews → Releases or escalates.", keyAreas: ["Credit control areas", "Credit limits & exposure", "Credit check types (static, dynamic)", "Credit release (VKM1-5)", "Integration with FI-AR", "T-Code: FD32, VKM1, VKM4"], careerNote: "Credit Management is increasingly important as companies focus on cash flow management. S/4HANA has introduced SAP Advanced Credit Management (FSCM)." },
      { id: "sd-sh", title: "Shipping", overview: "Shipping in SAP SD covers all aspects of getting goods from the warehouse to the customer — route determination, carrier selection, and shipment tracking.", whyItExists: "Efficient shipping management reduces freight costs, ensures on-time delivery, and provides customers with accurate delivery commitments.", howItWorks: "Shipping point determined on order → Delivery created → Route determined → Shipment document created (VT01N) → Carrier assigned → Goods issue → Proof of delivery.", keyAreas: ["Shipping point determination", "Route configuration", "Transportation (shipment documents)", "Proof of Delivery (POD)", "Freight cost settlement", "T-Code: VL01N, VT01N, VL06O"], careerNote: "Transportation Management integration with SD is a growing area. SAP TM (Transportation Management) expertise is in high demand." },
    ]
  },
  {
    id: "HR",
    label: "  HR",
    fullName: "Human Resources",
    emoji: "👥",
    tagline: "People. Process. Performance.",
    color: "#FF7EB6",
    glow: "rgba(255,126,182,0.3)",
    difficulty: 3,
    jobDemand: 4,
    topics: [
      { id: "hr-pa", title: "Personnel Administration", overview: "PA manages all employee master data throughout the employment lifecycle — from hiring to retirement. It's the foundation of the HR module.", whyItExists: "Accurate, centralized employee data is needed for payroll, time management, benefits, and compliance reporting.", howItWorks: "Employee hired → PA infotypes created (personal data, org assignment, address, bank details) → Data maintained throughout employment → Used by all other HR processes.", keyAreas: ["Infotype concept", "Personal data (IT0002)", "Organizational assignment (IT0001)", "Actions (hiring, transfer, termination)", "Personnel number ranges", "T-Code: PA40, PA30, PA20"], careerNote: "PA is the foundation of all HR knowledge. Every HR consultant must master infotypes and personnel actions." },
      { id: "hr-py", title: "Payroll", overview: "SAP Payroll calculates employee gross pay, deductions, taxes, and net pay — automatically, accurately, and in compliance with local laws.", whyItExists: "Payroll errors directly impact employee trust and legal compliance. Automated payroll eliminates calculation errors and ensures statutory compliance.", howItWorks: "Payroll driver runs → Reads time data, master data, wage types → Applies calculation rules → Generates payroll results → Bank transfer files created → Posting to FI.", keyAreas: ["Payroll areas & schemas", "Wage types", "Payroll driver (PC00_M99_CALC)", "Statutory deductions", "Posting to FI", "T-Code: PA03, PC00_M99_CALC"], careerNote: "Country-specific payroll expertise (India, US, Germany) is extremely specialized. SAP SuccessFactors Employee Central Payroll is the cloud direction." },
      { id: "hr-tm", title: "Time Management", overview: "Time Management records employee working times, absences, and overtime — feeding accurate data into payroll calculations.", whyItExists: "Accurate time recording ensures correct pay, compliance with labor laws, and management visibility into attendance patterns.", howItWorks: "Work schedules configured → Employees clock in/out (or supervisors approve) → Time evaluation processes raw times → Approved times flow to payroll.", keyAreas: ["Work schedule rules", "Absence & attendance types", "Time evaluation (RPTIME00)", "Substitutions", "Overtime calculation", "T-Code: PA61, PT60, PT63"], careerNote: "Time Management configuration is complex and highly country-specific. Integration with biometric systems and shift planning tools is an advanced skill." },
      { id: "hr-om", title: "Organizational Management", overview: "OM maintains the organizational hierarchy — positions, jobs, organizational units, and reporting relationships — providing the structure for all HR processes.", whyItExists: "A clear organizational structure is needed for workflow routing, headcount planning, succession planning, and managerial reporting.", howItWorks: "Org units, positions, and jobs are created and linked in the organizational plan. Employees are assigned to positions. The structure is used for workflow and reporting.", keyAreas: ["Org units, positions & jobs", "Plan versions", "Reporting structure", "Integration with PA", "Vacancy management", "T-Code: PPOME, PO10, PO13"], careerNote: "OM is the structural backbone of SuccessFactors integrations. Strong OM skills are essential for HR transformation projects." },
      { id: "hr-rec", title: "Recruitment", overview: "SAP Recruitment manages job postings, applicant tracking, interview scheduling, and the hiring process — from vacancy to employment.", whyItExists: "Structured recruitment processes reduce time-to-hire, ensure compliance with hiring regulations, and provide data for workforce planning.", howItWorks: "Vacancy created from OM position → Job posted internally/externally → Applications received → Screening & interviews → Offer → Hire (creates PA record).", keyAreas: ["Vacancy & applicant management", "Applicant actions", "Transfer to PA (hiring action)", "Reporting", "Integration with SuccessFactors Recruiting", "T-Code: PB10, PBA7"], careerNote: "Traditional SAP Recruitment is being replaced by SuccessFactors Recruiting. Hybrid integration knowledge is the current market need." },
      { id: "hr-te", title: "Training & Events", overview: "Training & Events Management (TEM) manages business event planning, employee training schedules, attendance tracking, and training cost management.", whyItExists: "Systematic training management ensures skill development, compliance training completion, and optimized training budget utilization.", howItWorks: "Training catalog created → Events scheduled → Employees booked → Attendance confirmed → Costs settled → Training history recorded in employee profile.", keyAreas: ["Business event types & groups", "Resource management", "Bookings & cancellations", "Cost transfer to CO", "Qualifications & appraisals link", "T-Code: LSO_PVGD, LSO_PSV1"], careerNote: "TEM is being replaced by SAP SuccessFactors Learning. Consultants with both on-premise and cloud learning expertise are in demand." },
    ]
  },
  {
    id: "PP",
    label: "  PP",
    fullName: "Production Planning",
    emoji: "🏭",
    tagline: "From demand to delivery",
    color: "#FB923C",
    glow: "rgba(251,146,60,0.3)",
    difficulty: 4,
    jobDemand: 4,
    topics: [
      { id: "pp-bom", title: "Bill of Materials (BOM)", overview: "A BOM lists all components needed to manufacture a product, along with quantities and units of measure. It's the recipe for production.", whyItExists: "Without a structured BOM, it's impossible to plan material requirements, calculate product costs, or execute production consistently.", howItWorks: "BOM created for finished product → Includes all raw materials, semi-finished goods, and quantities → MRP reads BOM to calculate requirements → Costing reads BOM to calculate product cost.", keyAreas: ["BOM categories (material, equipment)", "BOM header & items", "Alternative BOMs", "BOM explosion", "Validity & engineering change management", "T-Code: CS01, CS02, CS03"], careerNote: "BOM management is foundational for all manufacturing clients. Multi-level BOM explosion and variant configuration are advanced topics." },
      { id: "pp-rt", title: "Routing", overview: "A Routing defines the sequence of operations (work steps) required to manufacture a product, along with the work centers where each operation is performed.", whyItExists: "Routings provide the time data needed for scheduling, capacity planning, and calculating labor costs in product costing.", howItWorks: "Routing created with operations → Each operation assigned to a work center → Standard times (setup, machine, labor) defined → MRP uses routing for scheduling → Costing uses routing for cost calculation.", keyAreas: ["Operation & work center assignment", "Standard values (setup, machine time)", "Control keys", "Reference operation sets", "Alternative routings", "T-Code: CA01, CA02, CA03"], careerNote: "Routing expertise combined with work center configuration is essential for discrete manufacturing implementations." },
      { id: "pp-wc", title: "Work Centers", overview: "Work Centers represent machines, production lines, or labor groups where manufacturing operations are performed. They hold capacity and costing data.", whyItExists: "Work center data drives scheduling (when can work be done), capacity planning (how much can be done), and product costing (what does it cost to run this machine).", howItWorks: "Work center master created → Capacity (available hours) defined → Formulas for calculating time set up → Linked to cost center for costing → Routing operations assigned to work center.", keyAreas: ["Work center categories", "Capacity categories & available capacity", "Formulas & parameters", "Cost center & activity type assignment", "Shift schedules", "T-Code: CR01, CR02, CR03"], careerNote: "Work center and capacity planning expertise is specialized but highly valued in manufacturing projects, especially for bottleneck management." },
      { id: "pp-mrp", title: "MRP in PP", overview: "MRP in PP context drives production — it creates Planned Orders to manufacture products based on demand, available stock, and BOM/Routing data.", whyItExists: "Production planning for hundreds of products across multiple plants requires automated calculation of what to produce, when, and in what quantity.", howItWorks: "Demand (PIR or Sales Orders) → MRP run → Planned Orders created → Converted to Production Orders → Production executed → Goods Receipt.", keyAreas: ["Planning strategies (Make-to-Stock vs Make-to-Order)", "MRP types & controllers", "Planned orders (MD12)", "MRP exception handling", "Firming & fixing logic", "T-Code: MD01, MD04, MD12, MDVP"], careerNote: "PP-MRP with planning strategy expertise (particularly 10, 20, 40, 50) is one of the most sought-after skills in manufacturing implementations." },
      { id: "pp-po", title: "Production Orders", overview: "Production Orders are the execution documents in PP. They authorize production of a specific quantity of a material, collecting actual costs and quantities.", whyItExists: "Production Orders provide shop floor control — they tell workers what to make, where, when, and track actual vs planned performance.", howItWorks: "Planned Order converted to Production Order → Order released → Goods issue for components → Confirmations recorded → Goods Receipt of finished goods → Order settlement.", keyAreas: ["Production order lifecycle", "Order release & scheduling", "Goods issue (MIGO/CO11N)", "Confirmations", "Order settlement (KO88/CO88)", "T-Code: CO01, CO11N, CO15, CO88"], careerNote: "Production Order management including shop floor control and order settlement is core PP knowledge tested in every interview." },
      { id: "pp-cp", title: "Capacity Planning", overview: "Capacity Planning in SAP PP helps ensure that production plans can actually be executed given available machine and labor capacity.", whyItExists: "An MRP plan that ignores capacity constraints leads to impossible production schedules, missed deliveries, and frustrated shop floor staff.", howItWorks: "Production orders carry capacity requirements → Capacity evaluation shows overloads → Capacity leveling moves or splits orders → Finite scheduling creates realistic plans.", keyAreas: ["Capacity requirements", "Capacity evaluation (CM01)", "Capacity leveling", "Finite vs infinite scheduling", "Resource planning", "T-Code: CM01, CM21, CM50"], careerNote: "Capacity planning is an advanced PP topic increasingly important as manufacturers focus on optimizing throughput and delivery performance." },
    ]
  },
  {
    id: "WM",
    label: "  WM",
    fullName: "Warehouse Management",
    emoji: "🏗️",
    tagline: "Every bin. Every move. Tracked.",
    color: "#34D399",
    glow: "rgba(52,211,153,0.3)",
    difficulty: 3,
    jobDemand: 3,
    topics: [
      { id: "wm-sl", title: "Storage Locations", overview: "In WM, storage locations are subdivided into warehouses, storage types, and storage bins — providing granular location tracking for every material.", whyItExists: "Large warehouses with thousands of bins need systematic bin-level tracking to find materials quickly and manage space efficiently.", howItWorks: "Warehouse structure set up (Warehouse → Storage Type → Storage Section → Storage Bin) → Materials assigned to bins → Every movement tracked at bin level.", keyAreas: ["Warehouse structure", "Storage types & sections", "Storage bin master data", "Quant management", "Stock overview at bin level", "T-Code: LS01N, LS26, LX01"], careerNote: "WM structure configuration is foundational. Knowledge of how IM (Inventory Management) and WM interact is essential for warehouse projects." },
      { id: "wm-to", title: "Transfer Orders", overview: "Transfer Orders (TOs) are the execution documents in WM that instruct warehouse staff to move materials from one bin to another.", whyItExists: "Every physical movement in the warehouse needs a document for traceability, confirmation, and inventory accuracy.", howItWorks: "Transfer Requirement created (by GR, GI, or internal move) → TO created (automatically or manually) → Warehouse staff executes move → TO confirmed → Bin stock updated.", keyAreas: ["Transfer requirement creation", "TO creation (LT0A, LT01)", "TO confirmation (LT12)", "Picking via TO", "Background TO processing", "T-Code: LT01, LT0A, LT12, LT1A"], careerNote: "TO management is the core WM operational skill. RF/barcode-based TO processing is standard in modern warehouses." },
      { id: "wm-ps", title: "Putaway Strategies", overview: "Putaway Strategies define where incoming goods should be stored in the warehouse — automatically optimizing space utilization.", whyItExists: "Random putaway leads to inefficient space use and difficult picking. Systematic strategies like fixed bin or next empty bin maximize efficiency.", howItWorks: "Goods Receipt triggers TO creation → Putaway strategy determines destination bin → System proposes bin based on strategy → Staff confirms placement.", keyAreas: ["Fixed bin putaway", "Open storage", "Next empty bin", "Bulk storage", "Addition to existing stock", "T-Code: LT0A, LS26"], careerNote: "Putaway strategy configuration is an important WM design skill. Choosing the right strategy for a client's warehouse type is a key consulting competency." },
      { id: "wm-pis", title: "Picking Strategies", overview: "Picking Strategies determine which bins goods are picked from when fulfilling deliveries — optimizing picking routes and FIFO/FEFO compliance.", whyItExists: "Picking from the wrong bin can violate FIFO rules, create batch compliance issues, or result in inefficient picker travel routes.", howItWorks: "Delivery created → Picking TO generated → Strategy applied (FIFO, FEFO, largest quantity first) → Bin proposed → Picker confirms → Delivery updated.", keyAreas: ["FIFO (First In First Out)", "FEFO (First Expired First Out)", "Shelf life management", "Partial pallet picking", "Two-step picking", "T-Code: LT0A, VL02N"], careerNote: "FEFO picking is critical for food, pharma, and chemical industries. Batch management combined with picking strategies is a specialized area." },
      { id: "wm-ewm", title: "Extended Warehouse Management (EWM)", overview: "EWM is the advanced successor to classic WM, offering labor management, slotting, yard management, and sophisticated automation support.", whyItExists: "Classic WM cannot support modern warehouse automation (conveyors, sorters, robots), complex cross-docking, or detailed labor performance tracking.", howItWorks: "EWM manages the entire warehouse lifecycle with Warehouse Orders, Activity Areas, and Resource Management. It integrates with automation systems via MFS (Material Flow System).", keyAreas: ["Warehouse structure (Activity Areas)", "Warehouse Tasks & Orders", "Labor management", "Yard management", "Integration with MFS/automation", "T-Code: /SCWM/MON, /SCWM/PRDI"], careerNote: "EWM expertise is highly sought-after as companies modernize warehouses with automation. S/4HANA Embedded EWM is replacing classic WM." },
    ]
  },
  {
    id: "PM",
    label: "  PM",
    fullName: "Plant Maintenance",
    emoji: "🔧",
    tagline: "Zero downtime. Maximum uptime.",
    color: "#60A5FA",
    glow: "rgba(96,165,250,0.3)",
    difficulty: 3,
    jobDemand: 3,
    topics: [
      { id: "pm-fl", title: "Functional Locations", overview: "Functional Locations represent the physical structure of a plant — buildings, systems, and equipment positions. They're the addresses where maintenance is performed.", whyItExists: "Maintenance history, costs, and plans need to be tied to permanent physical locations — independent of which specific equipment is currently installed there.", howItWorks: "FL hierarchy created (e.g., Plant → Building → Floor → System → Point) → Equipment installed at FL → Maintenance notifications/orders reference FL → Cost analysis by location.", keyAreas: ["FL structure & hierarchy", "FL masking (naming convention)", "Equipment installation/dismantling", "Cost analysis by FL", "Permits linked to FL", "T-Code: IL01, IL02, IH01"], careerNote: "FL design is a critical early project activity. A well-designed FL structure enables decades of useful maintenance analysis." },
      { id: "pm-em", title: "Equipment Master", overview: "Equipment Masters represent individual physical assets (pumps, motors, machines) that are maintained, repaired, and tracked for their entire lifecycle.", whyItExists: "Each piece of equipment has its own maintenance history, warranty information, and cost data that needs to be tracked individually.", howItWorks: "Equipment created → Installed at Functional Location → Measurement points set up → Maintenance plans assigned → Notifications and orders reference equipment → Full history maintained.", keyAreas: ["Equipment categories", "Serial number management", "Measurement points & counters", "Warranty management", "Equipment hierarchy", "T-Code: IE01, IE02, IH08"], careerNote: "Equipment master design and serial number management are key PM skills, especially for asset-intensive industries like oil & gas and utilities." },
      { id: "pm-prev", title: "Preventive Maintenance", overview: "Preventive Maintenance automates the generation of maintenance orders based on time intervals or equipment usage counters — before breakdowns occur.", whyItExists: "Reactive maintenance (fixing after breakdown) is expensive and disruptive. Preventive maintenance reduces unplanned downtime and extends asset life.", howItWorks: "Maintenance Plan created (time-based or counter-based) → Plan scheduled → Maintenance call objects generated automatically → Work orders created → Executed → Completion confirmed.", keyAreas: ["Task lists (maintenance routines)", "Maintenance plans & items", "Maintenance call objects", "Strategy plans vs single cycle plans", "IP10 scheduling", "T-Code: IP01, IP10, IP30"], careerNote: "Preventive maintenance is the cornerstone of SAP PM value. SAP APM (Asset Performance Management) is the next evolution." },
      { id: "pm-wo", title: "Work Orders", overview: "Maintenance Work Orders are the execution documents for all maintenance activities — corrective, preventive, or inspection work.", whyItExists: "Work orders enable planning (materials, labor), cost collection, safety permitting, and performance measurement for every maintenance job.", howItWorks: "Order created (manually or from notification/plan) → Operations planned → Components reserved → Permits obtained → Work executed → Time confirmed → Order settled to cost center or asset.", keyAreas: ["Order types (PM01, PM02, PM03)", "Operations & work centers", "Components & materials", "Settlement rules", "Order confirmation (IW41)", "T-Code: IW31, IW32, IW41, IW38"], careerNote: "Work order management is the heart of SAP PM operations. Integration with MM for spare parts and CO for cost settlement is critical." },
      { id: "pm-notif", title: "Notifications", overview: "PM Notifications are used to report problems, malfunctions, or maintenance requests — before a work order is created for repair.", whyItExists: "Not every reported problem immediately requires a work order. Notifications enable initial assessment, prioritization, and tracking of all maintenance requests.", howItWorks: "User reports breakdown/request via notification (IW21) → Maintenance planner reviews → Either creates work order or completes without order → Notification closed.", keyAreas: ["Notification types (M1, M2, M3)", "Damage & cause coding", "Priority setting", "Long text documentation", "Notification completion", "T-Code: IW21, IW22, IW28"], careerNote: "Notification management is often the first PM process users encounter. Mobile notification creation via SAP Work Manager is standard in modern implementations." },
      { id: "pm-sp", title: "Spare Parts", overview: "Spare Parts management in PM links maintenance to inventory — ensuring critical spare parts are available when maintenance needs them.", whyItExists: "Lack of spare parts at breakdown time can turn a 2-hour repair into a 2-day shutdown. Systematic spare parts planning prevents this.", howItWorks: "Equipment linked to material master (spare parts) → Bills of Material for equipment → MRP can plan critical spare parts → Work orders reserve parts from stock → Usage tracked per equipment.", keyAreas: ["Equipment BOM (spare parts list)", "Material reservation from PM orders", "Spare parts valuation", "Critical spare parts planning", "Min/max stock levels for spares", "T-Code: IB11, IB01, MMBE"], careerNote: "PM-MM integration for spare parts is a specialized skill that significantly impacts maintenance efficiency. ABC analysis of spare parts is a standard consulting activity." },
    ]
  },
  {
    id: "QM",
    label: "  QM",
    fullName: "Quality Management",
    emoji: "✅",
    tagline: "Quality at every step",
    color: "#F472B6",
    glow: "rgba(244,114,182,0.3)",
    difficulty: 3,
    jobDemand: 3,
    topics: [
      { id: "qm-il", title: "Inspection Lots", overview: "Inspection Lots are the core QM document — they trigger quality inspections for materials received, produced, or dispatched.", whyItExists: "Every batch of goods needs a formal quality inspection record for traceability, compliance, and process control.", howItWorks: "Goods Receipt triggers inspection lot automatically → Usage Decision made (accept/reject) → Stock moves from quality inspection to unrestricted or blocked.", keyAreas: ["Inspection types (01-GR, 03-Production, 06-GI)", "Usage decision (QA11)", "Sample determination", "Results recording", "Integration with MM/PP", "T-Code: QA01, QA11, QA32"], careerNote: "Inspection lot management is foundational QM knowledge. Understanding integration points with MM (GR) and PP (production) is essential." },
      { id: "qm-qp", title: "Quality Plans", overview: "Quality Plans (Inspection Plans) define what is to be inspected, how, with what equipment, and to what standards for each material or operation.", whyItExists: "Consistent quality inspection requires documented, standardized procedures that don't rely on individual inspector knowledge.", howItWorks: "Inspection plan created with operations → Characteristics defined (dimensions, test values) → Sampling procedures assigned → Plan assigned to material → Drives inspection lot results recording.", keyAreas: ["Inspection plan creation (QP01)", "Master inspection characteristics", "Sampling procedures", "Inspection methods", "Control indicators", "T-Code: QP01, QS21, QDV1"], careerNote: "Quality plan configuration including sampling and characteristic setup is the core QM design skill." },
      { id: "qm-cc", title: "Control Charts", overview: "Statistical Process Control (SPC) charts in SAP QM monitor process performance over time, detecting trends before they cause quality failures.", whyItExists: "Detecting quality problems during production (not after) saves rework costs and prevents defective products reaching customers.", howItWorks: "Inspection characteristics configured for SPC → Results recorded over time → Control charts generated → Alarms triggered if values exceed control limits.", keyAreas: ["Control chart types (X-bar, R-chart)", "Control limits", "Warning limits", "SPC triggering in inspection plans", "Quality score calculation", "T-Code: QGC1, QGP1"], careerNote: "SPC/Control chart expertise is valued in automotive (IATF 16949) and pharmaceutical (FDA compliance) industries." },
      { id: "qm-dr", title: "Defect Recording", overview: "Defect Recording captures quality problems systematically — what failed, where, how many, and why — enabling root cause analysis and corrective action.", whyItExists: "Without systematic defect recording, the same quality problems recur because root causes aren't identified and eliminated.", howItWorks: "Defects recorded during inspection → Defect classes, codes, and locations captured → 8D/CAPA triggered → Defect analysis reports generated → Trends identified.", keyAreas: ["Defect codes & catalogs (QS41)", "Defect classes", "Integration with QM notifications", "CAPA (Corrective Action)", "Defect analysis reports", "T-Code: QF01, QF11, QM01"], careerNote: "Defect recording with CAPA integration is critical for ISO 9001 compliance and automotive quality standards." },
      { id: "qm-qc", title: "Quality Certificates", overview: "Quality Certificates are formal documents confirming that materials meet specified quality requirements — required by many customers and regulations.", whyItExists: "Many industries (pharma, food, automotive) legally require certificates of conformity or analysis before accepting materials.", howItWorks: "Certificate profile created → Linked to material/customer → On goods delivery, certificate generated automatically with actual inspection results → Sent to customer with shipment.", keyAreas: ["Certificate profiles (QC01)", "Certificate of conformance", "Certificate of analysis", "Integration with SD shipping", "Archive management", "T-Code: QC01, QC21, QC51"], careerNote: "Quality certificate management is mandatory for pharma and food sectors. SD integration for automatic certificate dispatch is a premium skill." },
      { id: "qm-am", title: "Audit Management", overview: "SAP QM Audit Management supports planning, executing, and following up on quality audits — internal, supplier, and customer audits.", whyItExists: "Regular audits ensure processes meet quality standards, regulatory requirements, and customer expectations. Systematic audit management ensures nothing falls through the cracks.", howItWorks: "Audit plan created → Checklists prepared → Audit executed → Findings recorded → Corrective actions assigned → Effectiveness verified → Audit closed.", keyAreas: ["Audit types (system, process, product)", "Question catalogs & checklists", "Finding categories", "Corrective action tracking", "Audit evaluation & scoring", "T-Code: PLMD_AUDIT"], careerNote: "Audit Management expertise is valuable for highly regulated industries. Integration with SAP EHS (Environment, Health & Safety) is an advanced topic." },
    ]
  },
  {
    id: "ABAP",
    label: "  ABAP",
    fullName: "Advanced Business App Programming",
    emoji: "💻",
    tagline: "Code that runs the enterprise",
    color: "#818CF8",
    glow: "rgba(129,140,248,0.3)",
    difficulty: 5,
    jobDemand: 4,
    topics: [
      { id: "abap-alv", title: "Reports & ALV", overview: "ABAP Reports and ALV (ABAP List Viewer) are used to extract, process, and display business data in formatted, interactive lists and grids.", whyItExists: "Standard SAP reports don't always meet specific business requirements. Custom ABAP reports provide exactly the data presentation needed.", howItWorks: "ABAP program written with SELECT statements to fetch data → Data processed and formatted → ALV Grid or ALV List displays output with sort, filter, export features.", keyAreas: ["Classic ABAP reports", "ALV Grid (CL_GUI_ALV_GRID)", "Field catalogs", "Selection screens", "ALV events (user-command, hotspot)", "T-Code: SE38, SE80"], careerNote: "ALV programming is the most common ABAP task. Modern ALV with OO (Object-Oriented) approach and CDS-based reports are the current standard." },
      { id: "abap-bapi", title: "BAPIs & BADIs", overview: "BAPIs (Business Application Programming Interfaces) are standardized SAP APIs for external integration. BADIs (Business Add-Ins) are enhancement spots for custom logic.", whyItExists: "BAPIs enable external systems to call SAP functions without direct database access. BADIs allow custom code to be added to standard SAP processes safely.", howItWorks: "BAPI: External call → RFC call to BAPI function module → SAP processes and commits → Returns result. BAdI: Standard code runs → Reaches enhancement spot → Calls customer implementation → Returns to standard flow.", keyAreas: ["BAPI creation & testing (BAPI Explorer)", "BAdI definition & implementation (SE18/SE19)", "Enhancement framework", "Classic vs Kernel BADIs", "BAPI error handling", "T-Code: SE18, SE19, BAPI"], careerNote: "BAPI and BAdI knowledge is essential for any ABAP developer working on integration or enhancement projects. S/4HANA has expanded the BAdI framework significantly." },
      { id: "abap-ue", title: "User Exits", overview: "User Exits are predefined points in standard SAP code where customer-specific code can be inserted to modify standard behavior.", whyItExists: "SAP cannot anticipate every business requirement. User Exits provide safe, upgrade-compatible points to inject custom logic into standard programs.", howItWorks: "SAP identifies enhancement point in standard code → Creates subroutine call (FORM EXIT_...) → Customer code written in exit → Called automatically during standard program execution.", keyAreas: ["Customer Exits vs BADIs", "Finding exits (SMOD, CMOD)", "EXIT_ naming convention", "Project activation (CMOD)", "Common exits by module", "T-Code: SMOD, CMOD, SE80"], careerNote: "While BADIs are the modern approach, many existing systems still use User Exits. Understanding both old and new enhancement techniques is expected of experienced ABAP developers." },
      { id: "abap-sf", title: "Smartforms / Adobe Forms", overview: "Smartforms and Adobe Forms are SAP tools for creating formatted output documents — invoices, purchase orders, delivery notes, and reports.", whyItExists: "Business documents need professional formatting, logos, barcodes, and specific layouts that plain ABAP output cannot provide.", howItWorks: "Form layout designed in Smartform/ADS editor → Form called from ABAP program → Data passed to form → Form renders output (print, PDF, email) → Output goes to spool or directly to device.", keyAreas: ["Smartform design (SMARTFORMS)", "Adobe Form layout (SFP)", "Driver program", "Output determination integration", "PDF generation", "T-Code: SMARTFORMS, SFP, NACE"], careerNote: "Adobe Forms (SAP ADS) is the strategic direction. Consultants who can migrate Smartforms to Adobe Forms are in demand for S/4HANA projects." },
      { id: "abap-oo", title: "OOPS ABAP", overview: "Object-Oriented ABAP (OO-ABAP) enables modern, modular, reusable code using classes, interfaces, inheritance, and polymorphism.", whyItExists: "Traditional procedural ABAP becomes unmaintainable at scale. OO design patterns create more maintainable, testable, and reusable code.", howItWorks: "Classes defined (global in SE24 or local) → Objects instantiated → Methods called → Inheritance and interfaces enable polymorphism → Design patterns applied (MVC, Factory, etc.).", keyAreas: ["CLASS/METHOD/INTERFACE syntax", "Inheritance & polymorphism", "Exception classes", "ABAP Unit testing", "Design patterns in ABAP", "T-Code: SE24, SE80"], careerNote: "OO-ABAP is mandatory for S/4HANA development, Fiori app backends, and CDS views. ABAP with OO and CDS is the skill stack for modern SAP development." },
      { id: "abap-hana", title: "ABAP on HANA", overview: "ABAP on HANA leverages the in-memory capabilities of SAP HANA to write high-performance database operations using CDS (Core Data Services) and AMDP.", whyItExists: "HANA's in-memory processing can execute complex queries 1000x faster than traditional databases — but only if code is written to push processing to the database layer.", howItWorks: "CDS views define data models declaratively → ABAP reads CDS views instead of tables → AMDPs push complex logic to HANA engine → Performance dramatically improved.", keyAreas: ["CDS view development", "AMDP (HANA Stored Procedures in ABAP)", "Code pushdown principle", "Open SQL enhancements", "Performance analysis (SQL Trace)", "T-Code: SE11, transaction /n/IWFND/MAINT_SERVICE"], careerNote: "ABAP on HANA with CDS is the most in-demand ABAP skill for S/4HANA. CDS-based OData services for Fiori apps are a premium specialization." },
    ]
  },
  {
    id: "BASIS",
    label: "  BASIS",
    fullName: "System Administration",
    emoji: "⚙️",
    tagline: "The engine room of SAP",
    color: "#94A3B8",
    glow: "rgba(148,163,184,0.3)",
    difficulty: 4,
    jobDemand: 3,
    topics: [
      { id: "basis-sl", title: "System Landscape", overview: "The System Landscape defines how SAP systems are organized — typically Development, Quality/Testing, and Production — and how changes flow between them.", whyItExists: "Changes must be tested before going live. A structured landscape ensures stability of production while enabling development and testing.", howItWorks: "Dev → QA → Production. Changes developed in Dev → Transported to QA for testing → Approved changes transported to Production. TMS manages this flow.", keyAreas: ["3-system landscape (DEV-QA-PRD)", "System IDs and clients", "Landscape Director", "SLD (System Landscape Directory)", "Solution Manager integration", "T-Code: SMSY, SCC4"], careerNote: "Landscape architecture knowledge is foundational for BASIS. S/4HANA Cloud introduces new landscape concepts that BASIS admins must understand." },
      { id: "basis-tms", title: "Transport Management (TMS)", overview: "TMS manages the movement of configuration changes and ABAP development objects from one SAP system to another in a controlled, traceable way.", whyItExists: "Without controlled transports, developers might accidentally overwrite production settings or lose track of what changes were made and when.", howItWorks: "Change Request created in Dev → Objects added to transport → Transport released → Imported into QA → After approval, imported into Production → TMS logs all imports.", keyAreas: ["Transport Request types (Workbench, Customizing)", "TMS configuration (STMS)", "Import queue management", "Emergency transports", "Transport logs & troubleshooting", "T-Code: STMS, SE01, SE09, SE10"], careerNote: "TMS expertise is fundamental BASIS knowledge. Troubleshooting failed transports and managing emergency change requests are daily BASIS activities." },
      { id: "basis-ua", title: "User Administration", overview: "User Administration in SAP manages user accounts, roles, profiles, and authorizations — ensuring users have the right access to the right transactions.", whyItExists: "SAP contains sensitive financial and business data. Proper access control prevents unauthorized transactions, data breaches, and audit failures.", howItWorks: "User created (SU01) → Roles assigned (collections of authorization objects) → Authorization check runs on every transaction → Profiles generated → Audit trail maintained.", keyAreas: ["User types (Dialog, System, Service)", "Role (PFCG) creation & maintenance", "Authorization objects & fields", "Segregation of Duties (SoD)", "GRC (Governance, Risk & Compliance) integration", "T-Code: SU01, PFCG, SU53, SUIM"], careerNote: "Authorization and role management is one of the highest-demand BASIS skills. GRC expertise is premium — audit-driven demand for SoD management is growing." },
      { id: "basis-pt", title: "Performance Tuning", overview: "Performance Tuning ensures SAP systems run efficiently — identifying and resolving bottlenecks in database, memory, work processes, and network.", whyItExists: "Slow SAP systems directly impact business productivity. Performance issues that affect thousands of users need systematic diagnosis and resolution.", howItWorks: "ABAP programs with slow runtimes → Identified via workload monitor (SM50, ST05) → SQL trace shows problematic queries → ABAP code or database indexes adjusted → Performance improved.", keyAreas: ["Workload monitor (ST05, SM50)", "ABAP runtime analysis (SE30)", "SQL trace & EXPLAIN plan", "Memory management (SM12, SM13)", "Background job management (SM37)", "T-Code: ST05, SM50, SE30, AL11"], careerNote: "Performance tuning expertise is highly valued. HANA database analysis tools add a new dimension to this skill for S/4HANA environments." },
      { id: "basis-hana", title: "SAP HANA Admin", overview: "SAP HANA Administration covers database monitoring, backup/recovery, user management, and performance optimization for the HANA in-memory database.", whyItExists: "HANA is radically different from traditional databases. Specialized administration knowledge is needed to keep HANA-based SAP systems running optimally.", howItWorks: "HANA Studio or SAP HANA Cockpit used for monitoring → Alerts reviewed → Memory management → Backup scheduling → SQL performance analysis → Security management.", keyAreas: ["HANA Studio / Cockpit", "Memory management & allocation", "Backup & recovery", "Multi-tenant database containers", "HANA performance monitoring", "T-Code: HANA Studio, SAP HANA Cockpit"], careerNote: "HANA DBA skills are in very high demand as most SAP systems move to HANA. Combining HANA admin with BASIS knowledge commands significant salary premiums." },
      { id: "basis-cp", title: "Cloud Platform", overview: "SAP Business Technology Platform (BTP) is SAP's cloud platform for integration, extension development, analytics, and AI — the strategic platform for SAP's future.", whyItExists: "Cloud-first customers need an integration and extension platform that works across SAP and non-SAP cloud solutions without complex on-premise infrastructure.", howItWorks: "BTP provides services: Integration Suite (connects systems), Extension Suite (builds apps), Analytics Cloud (reporting), HANA Cloud (database) — all managed via the BTP Cockpit.", keyAreas: ["BTP Cockpit & subaccounts", "Integration Suite (CPI)", "SAP Build (low-code development)", "BTP security & user management", "SAP Fiori Launchpad on BTP", "T-Code: BTP Cockpit (browser)"], careerNote: "BTP expertise is the fastest-growing SAP skill area. Integration Suite (formerly CPI) consultants are in enormous demand as companies move to hybrid cloud architectures." },
    ]
  },
];

/* ── DIFFICULTY & DEMAND BAR ──────────────────────────── */
function RatingBar({ value, max = 5, color }) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{
          height: "6px", flex: 1, borderRadius: "3px",
          background: i < value ? color : "rgba(255,255,255,0.1)",
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

/* ── TOPIC DETAIL DRAWER ──────────────────────────────── */
function TopicDrawer({ topic, color, onClose, darkMode }) {
  const dm = darkMode;
  const bg = dm ? "rgba(6,11,24,0.98)" : "rgba(255,255,255,0.98)";
  const txt = dm ? "#E8F0FF" : "#0A1128";
  const sec = dm ? "#6B82A8" : "#4A6080";
  const cardBg = dm ? "rgba(255,255,255,0.04)" : "rgba(0,102,255,0.04)";
  const cardBorder = dm ? "rgba(255,255,255,0.08)" : "rgba(0,102,255,0.1)";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-end",
      animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxHeight: "85vh", overflowY: "auto",
        background: bg,
        borderRadius: "24px 24px 0 0",
        padding: "28px 28px 40px",
        boxShadow: `0 -8px 60px ${color}22`,
        borderTop: `2px solid ${color}40`,
        animation: "slideUp 0.3s cubic-bezier(.4,0,.2,1)",
        maxWidth: "760px", margin: "0 auto",
      }}>
        {/* Handle */}
        <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: dm ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)", margin: "0 auto 24px" }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "12px" }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "22px", fontWeight: "800", color: txt, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {topic.title}
          </h2>
          <button onClick={onClose} style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "10px", border: `1px solid ${cardBorder}`, background: cardBg, cursor: "pointer", color: sec, fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {[
          { label: "📖 Overview", content: topic.overview },
          { label: "💡 Why It Exists", content: topic.whyItExists },
          { label: "⚙️ How It Works", content: topic.howItWorks },
          { label: "🚀 Career Relevance", content: topic.careerNote },
        ].map(sec => (
          <div key={sec.label} style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", fontWeight: "700", color: color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>{sec.label}</p>
            <p style={{ fontSize: "14px", color: dm ? "#B0C4E0" : "#2A3A5A", lineHeight: "1.75" }}>{sec.content}</p>
          </div>
        ))}

        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>🔑 Key Areas & T-Codes</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {topic.keyAreas.map((area, i) => (
              <span key={i} style={{
                padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                background: `${color}15`, color: color,
                border: `1px solid ${color}30`,
              }}>{area}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MODULE CARD ──────────────────────────────────────── */
function ModuleCard({ mod, isSelected, onClick, darkMode }) {
  const dm = darkMode;
  return (
    <div onClick={onClick} style={{
      padding: "16px 18px",
      borderRadius: "16px",
      cursor: "pointer",
      border: `1px solid ${isSelected ? mod.color + "60" : (dm ? "rgba(255,255,255,0.07)" : "rgba(0,102,255,0.1)")}`,
      background: isSelected ? `${mod.color}12` : (dm ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)"),
      transition: "all 0.2s ease",
      transform: isSelected ? "scale(1.01)" : "scale(1)",
      boxShadow: isSelected ? `0 4px 20px ${mod.glow}` : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <span style={{ fontSize: "22px" }}>{mod.emoji}</span>
        <div>
          <p style={{ fontSize: "13px", fontWeight: "800", color: isSelected ? mod.color : (dm ? "#D0DCFF" : "#0A1128"), fontFamily: "'Outfit', sans-serif" }}>{mod.label}</p>
          <p style={{ fontSize: "10px", color: dm ? "#4A6080" : "#8AAAC0" }}>{mod.topics.length} topics</p>
        </div>
      </div>
      <div style={{ display: "grid", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
          <span style={{ fontSize: "9px", fontWeight: "600", color: dm ? "#3A5070" : "#8AAAC0", letterSpacing: "0.05em" }}>DIFFICULTY</span>
          <span style={{ fontSize: "9px", fontWeight: "600", color: dm ? "#3A5070" : "#8AAAC0", letterSpacing: "0.05em" }}>JOB DEMAND</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ flex: 1 }}><RatingBar value={mod.difficulty} color={mod.color} /></div>
          <div style={{ flex: 1 }}><RatingBar value={mod.jobDemand} color="#00e1ff" /></div>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN LEARN COMPONENT ─────────────────────────────── */
export default function Learn({ darkMode }) {
  const [selectedMod, setSelectedMod] = useState(SAP_MODULES[0]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [search, setSearch] = useState("");

  const dm = darkMode;
  const txt = (op = 1) => ({ color: dm ? `rgba(240,246,255,${op})` : `rgba(10,17,40,${op})` });
  const sec = dm ? "#6B82A8" : "#4A6080";
  const cardBg = dm ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)";
  const cardBorder = dm ? "rgba(255,255,255,0.07)" : "rgba(0,102,255,0.1)";

  const filteredTopics = selectedMod.topics.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.overview.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", animation: "fadeInUp .4s ease" }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "32px", fontWeight: "800", ...txt(1), letterSpacing: "-0.03em", marginBottom: "6px" }}>
          📚 Learn SAP
        </h1>
        <p style={{ ...txt(0.45), fontSize: "14px" }}>
          {SAP_MODULES.length} modules · {SAP_MODULES.reduce((a, m) => a + m.topics.length, 0)} topics — tap any topic to deep-dive
        </p>
      </div>

      {/* Module grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginBottom: "28px" }}>
        {SAP_MODULES.map(mod => (
          <ModuleCard key={mod.id} mod={mod} isSelected={selectedMod.id === mod.id} onClick={() => { setSelectedMod(mod); setSearch(""); }} darkMode={darkMode} />
        ))}
      </div>

      {/* Selected module header */}
      <div style={{
        background: `linear-gradient(135deg, ${selectedMod.color}18 0%, ${selectedMod.color}08 100%)`,
        border: `1px solid ${selectedMod.color}30`,
        borderRadius: "20px",
        padding: "24px 24px 20px",
        marginBottom: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: `${selectedMod.color}20`, border: `1px solid ${selectedMod.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }}>
            {selectedMod.emoji}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: selectedMod.color, letterSpacing: "0.08em", background: `${selectedMod.color}20`, padding: "2px 8px", borderRadius: "20px" }}>{selectedMod.label}</span>
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "20px", fontWeight: "800", ...txt(1), letterSpacing: "-0.02em" }}>{selectedMod.fullName}</h2>
            <p style={{ fontSize: "12px", color: sec, fontStyle: "italic" }}>"{selectedMod.tagline}"</p>
          </div>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search in ${selectedMod.label} topics...`}
          style={{
            width: "100%", padding: "10px 14px",
            borderRadius: "12px", fontSize: "13px",
            background: dm ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)",
            border: `1px solid ${dm ? "rgba(255,255,255,0.1)" : "rgba(0,102,255,0.15)"}`,
            color: dm ? "#E8F0FF" : "#0A1128",
            outline: "none", fontFamily: "'Outfit', sans-serif",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Topics list */}
      <div style={{ display: "grid", gap: "8px" }}>
        {filteredTopics.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: sec, fontSize: "14px" }}>
            No topics match "{search}"
          </div>
        )}
        {filteredTopics.map((topic, i) => (
          <div key={topic.id} onClick={() => setSelectedTopic(topic)}
            style={{
              padding: "16px 20px",
              borderRadius: "14px",
              cursor: "pointer",
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${selectedMod.color}50`; e.currentTarget.style.transform = "translateX(4px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.transform = "translateX(0)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `${selectedMod.color}18`, border: `1px solid ${selectedMod.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", fontWeight: "800", color: selectedMod.color }}>{i + 1}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: "700", ...txt(1), marginBottom: "2px" }}>{topic.title}</p>
                <p style={{ fontSize: "12px", color: sec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic.overview.slice(0, 80)}...</p>
              </div>
            </div>
            <span style={{ color: selectedMod.color, fontSize: "16px", flexShrink: 0, opacity: 0.8 }}>→</span>
          </div>
        ))}
      </div>

      {/* Drawer */}
      {selectedTopic && (
        <TopicDrawer topic={selectedTopic} color={selectedMod.color} onClose={() => setSelectedTopic(null)} darkMode={darkMode} />
      )}
    </div>
  );
}