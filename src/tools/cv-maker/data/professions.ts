/**
 * Curated profession presets for AHADEX CV Maker.
 * Selecting a profession pre-fills realistic starter summary, experience,
 * education, and skills that the user can freely expand, modify, or remove.
 */

import type { CvFormData, ProfessionPreset } from '../types';

export const PROFESSION_PRESETS: readonly ProfessionPreset[] = [
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    categoryLabel: 'Technology',
    shortHint: 'Web apps, APIs, cloud reliability & scalable code',
    headline: 'Senior Full-Stack Software Engineer',
    summary:
      'Product-focused Software Engineer with 5+ years of experience building reliable web applications, TypeScript services, and distributed APIs. Known for cutting page load times, mentoring junior engineers, and shipping maintainable architectures under tight delivery schedules.',
    summarySnippets: [
      'Reduced API p95 latency by 38% through query indexing and edge caching.',
      'Led cross-functional migration to strict TypeScript and automated Playwright testing.',
      'Architected zero-downtime deployment pipelines serving 250K+ monthly active users.',
    ],
    experiences: [
      {
        role: 'Senior Software Engineer',
        company: 'Northstar Digital Systems',
        location: 'Remote / London',
        startDate: 'Mar 2023',
        endDate: 'Present',
        highlights: [
          'Built and scaled React and Node.js customer workflows handling 1.4M monthly requests.',
          'Reduced core bundle payload by 32% and improved Core Web Vitals across mobile views.',
          'Mentored four engineers through weekly architecture reviews and automated test coverage.',
        ],
      },
      {
        role: 'Software Developer',
        company: 'Crestline Commerce',
        location: 'Manchester, UK',
        startDate: 'Jun 2020',
        endDate: 'Feb 2023',
        highlights: [
          'Developed checkout REST endpoints and payment webhook handlers with 99.95% uptime.',
          'Automated CI validation checks that cut production regressions in half.',
        ],
      },
    ],
    educations: [
      {
        degree: 'B.Sc. in Computer Science',
        school: 'University of Leeds',
        location: 'Leeds, UK',
        graduationYear: '2020',
        details: 'First Class Honors · Distributed Systems & Software Engineering track',
      },
    ],
    skills: [
      'TypeScript',
      'React',
      'Node.js',
      'PostgreSQL',
      'REST & GraphQL',
      'Docker',
      'Automated Testing',
      'System Design',
    ],
    languages: ['English (Fluent)', 'Spanish (Conversational)'],
    certifications: ['AWS Certified Developer – Associate'],
  },
  {
    id: 'product-designer',
    title: 'UI / UX & Product Designer',
    categoryLabel: 'Design',
    shortHint: 'Design systems, user research & interactive prototypes',
    headline: 'Lead Product & UI/UX Designer',
    summary:
      'Human-centered Product Designer specializing in multi-platform design systems, conversion-focused onboarding, and WCAG-accessible interfaces. Translates qualitative user interviews and funnel analytics into crisp Figma prototypes and shipped product wins.',
    summarySnippets: [
      'Increased onboarding completion by 27% after simplifying multi-step mobile flows.',
      'Maintained a tokenized design system adopted across 6 engineering squads.',
      'Conducted 40+ moderated usability sessions to validate complex workflow redesigns.',
    ],
    experiences: [
      {
        role: 'Senior Product Designer',
        company: 'HarborPay Financial',
        location: 'Toronto, Canada',
        startDate: 'Jan 2022',
        endDate: 'Present',
        highlights: [
          'Redesigned invoice and payout workflows, lifting weekly task completion rate by 24%.',
          'Authored a WCAG 2.2 AA component library in Figma synced directly with Tailwind tokens.',
        ],
      },
      {
        role: 'UX Designer',
        company: 'Studio Meridian',
        location: 'Vancouver, Canada',
        startDate: 'May 2019',
        endDate: 'Dec 2021',
        highlights: [
          'Delivered responsive SaaS dashboards and interactive prototypes for 12 B2B clients.',
          'Partnered with product managers to establish quarterly usability testing benchmarks.',
        ],
      },
    ],
    educations: [
      {
        degree: 'B.Des. in Interaction Design',
        school: 'OCAD University',
        location: 'Toronto, Canada',
        graduationYear: '2019',
        details: 'Graduated with Distinction · Focus on Typography & Human-Computer Interaction',
      },
    ],
    skills: [
      'Figma',
      'Design Systems',
      'User Research',
      'Wireframing',
      'Prototyping',
      'WCAG Accessibility',
      'Information Architecture',
      'HTML & CSS',
    ],
    languages: ['English (Native)', 'French (Intermediate)'],
    certifications: ['NN/g UX Certification'],
  },
  {
    id: 'digital-marketer',
    title: 'Digital Marketing & SEO Specialist',
    categoryLabel: 'Marketing',
    shortHint: 'Organic search growth, content strategy & performance campaigns',
    headline: 'Growth Marketing & Technical SEO Lead',
    summary:
      'Data-driven Digital Marketing Specialist with a proven record growing organic search traffic, optimizing paid acquisition ROI, and structuring high-converting editorial funnels. Skilled at pairing technical SEO audits with compelling multi-channel storytelling.',
    summarySnippets: [
      'Grew non-branded organic traffic by 165% over 12 months via technical SEO and topic clusters.',
      'Managed $45K/month paid search and social spend while lowering CPA by 29%.',
      'Built lifecycle email sequences driving 34% repeat customer retention.',
    ],
    experiences: [
      {
        role: 'SEO & Growth Manager',
        company: 'BrightPath SaaS',
        location: 'Austin, TX',
        startDate: 'Apr 2022',
        endDate: 'Present',
        highlights: [
          'Scaled organic blog and tool landing pages from 18K to 64K monthly visits.',
          'Implemented structured schema markup and internal linking frameworks across 120+ URLs.',
        ],
      },
      {
        role: 'Digital Marketing Coordinator',
        company: 'Oakridge Media Group',
        location: 'Dallas, TX',
        startDate: 'Aug 2019',
        endDate: 'Mar 2022',
        highlights: [
          'Executed Google Ads, Meta campaigns, and A/B landing page tests for 15 SME accounts.',
          'Built weekly Looker Studio attribution dashboards for executive stakeholders.',
        ],
      },
    ],
    educations: [
      {
        degree: 'B.B.A. in Marketing',
        school: 'University of Texas at Austin',
        location: 'Austin, TX',
        graduationYear: '2019',
        details: 'Digital Analytics Concentration',
      },
    ],
    skills: [
      'Technical SEO',
      'Google Search Console',
      'Google Analytics 4',
      'Content Strategy',
      'Google Ads',
      'Conversion Rate Optimization',
      'Email Automation',
      'A/B Testing',
    ],
    languages: ['English (Native)'],
    certifications: ['Google Analytics Certification', 'HubSpot Content Marketing'],
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst & BI Specialist',
    categoryLabel: 'Analytics',
    shortHint: 'SQL modeling, dashboards, KPI forecasting & reporting',
    headline: 'Senior Data & Business Intelligence Analyst',
    summary:
      'Analytical Business Intelligence Specialist adept at turning raw transactional datasets into clear executive dashboards and revenue forecasts. Strong foundation in SQL warehousing, Python data pipelines, and stakeholder storytelling.',
    summarySnippets: [
      'Automated weekly board KPI reporting, saving 14 hours of manual spreadsheet work weekly.',
      'Identified churn drivers via cohort SQL modeling, helping recover $180K in annual ARR.',
      'Built self-serve Power BI and Looker models used daily by 70+ operations managers.',
    ],
    experiences: [
      {
        role: 'Data Analyst',
        company: 'Clearview Logistics',
        location: 'Chicago, IL',
        startDate: 'Feb 2022',
        endDate: 'Present',
        highlights: [
          'Designed SQL warehouse views and Tableau dashboards tracking fleet utilization and SLA metrics.',
          'Partnered with finance leaders to forecast seasonal demand within 3.5% variance.',
        ],
      },
      {
        role: 'Junior Reporting Analyst',
        company: 'Midwest Retail Partners',
        location: 'Chicago, IL',
        startDate: 'Jul 2019',
        endDate: 'Jan 2022',
        highlights: [
          'Cleaned and validated multi-store inventory datasets using Python (pandas) and Excel.',
          'Delivered promotional margin analysis for quarterly merchandising reviews.',
        ],
      },
    ],
    educations: [
      {
        degree: 'B.S. in Statistics & Economics',
        school: 'University of Illinois',
        location: 'Urbana-Champaign, IL',
        graduationYear: '2019',
        details: 'GPA 3.8/4.0 · Applied Econometrics',
      },
    ],
    skills: [
      'SQL',
      'Python (pandas)',
      'Power BI',
      'Tableau',
      'Excel / Power Query',
      'Cohort Analysis',
      'Data Modeling',
      'A/B Experimentation',
    ],
    languages: ['English (Fluent)'],
    certifications: ['Microsoft Certified: Power BI Data Analyst'],
  },
  {
    id: 'finance-manager',
    title: 'Finance & Accounting Manager',
    categoryLabel: 'Finance',
    shortHint: 'FP&A, month-end close, audit readiness & cash flow strategy',
    headline: 'Chartered Finance & Accounting Manager',
    summary:
      'Detail-oriented Finance Manager with 7+ years leading month-end close, statutory audits, multi-entity budgeting, and cash-flow forecasting. Committed to strong internal controls, clean IFRS reporting, and clear strategic guidance for leadership.',
    summarySnippets: [
      'Shortened monthly close cycle from 11 business days to 5 via reconciliation templates.',
      'Directed annual budgeting across $18M operating expense portfolio with 98% forecast accuracy.',
      'Passed 4 consecutive external financial audits with zero material adjustments.',
    ],
    experiences: [
      {
        role: 'Finance Manager',
        company: 'Sterling Industrial Group',
        location: 'Dubai, UAE',
        startDate: 'May 2021',
        endDate: 'Present',
        highlights: [
          'Oversee IFRS financial statements, VAT filings, and working-capital liquidity planning.',
          'Partner with department heads to evaluate capex ROI and cost-saving initiatives.',
        ],
      },
      {
        role: 'Senior Accountant',
        company: 'Apex Advisory Partners',
        location: 'Abu Dhabi, UAE',
        startDate: 'Sep 2018',
        endDate: 'Apr 2021',
        highlights: [
          'Managed general ledger reconciliations, payroll verification, and intercompany eliminations.',
          'Prepared quarterly variance packs and external audit schedules.',
        ],
      },
    ],
    educations: [
      {
        degree: 'M.Sc. in Accounting & Finance',
        school: 'University of Manchester',
        location: 'Manchester, UK',
        graduationYear: '2018',
        details: 'Corporate Financial Reporting & Risk Management',
      },
    ],
    skills: [
      'IFRS Reporting',
      'FP&A & Budgeting',
      'Cash Flow Forecasting',
      'Month-End Close',
      'Audit Coordination',
      'SAP / QuickBooks',
      'Financial Modeling',
      'VAT & Tax Compliance',
    ],
    languages: ['English (Fluent)', 'Arabic (Conversational)'],
    certifications: ['ACCA Qualified Accountant'],
  },
  {
    id: 'registered-nurse',
    title: 'Healthcare & Registered Nurse',
    categoryLabel: 'Healthcare',
    shortHint: 'Patient care, triage coordination & clinical safety',
    headline: 'Registered Nurse (RN) – Acute & Outpatient Care',
    summary:
      'Compassionate Registered Nurse with 5+ years delivering evidence-based patient care across acute medical wards and outpatient clinics. Recognized for calm clinical triage, clear patient education, and strict medication safety protocols.',
    summarySnippets: [
      'Maintained 99% patient satisfaction feedback across post-discharge follow-up surveys.',
      'Coordinated multidisciplinary care plans for 12–16 acute care patients per shift.',
      'Precepted 6 newly licensed nurses on EHR charting and infection-control protocols.',
    ],
    experiences: [
      {
        role: 'Registered Nurse',
        company: 'St. Jude Regional Medical Center',
        location: 'Boston, MA',
        startDate: 'Mar 2021',
        endDate: 'Present',
        highlights: [
          'Administer IV therapy, wound care, and continuous telemetry monitoring in a 32-bed unit.',
          'Collaborate daily with physicians, pharmacists, and physical therapists on discharge readiness.',
        ],
      },
      {
        role: 'Staff Nurse',
        company: 'Harborview Community Clinic',
        location: 'Cambridge, MA',
        startDate: 'Jun 2019',
        endDate: 'Feb 2021',
        highlights: [
          'Conducted intake assessments, vital-sign triage, and chronic disease education.',
          'Streamlined vaccination clinic scheduling to reduce wait times by 20%.',
        ],
      },
    ],
    educations: [
      {
        degree: 'Bachelor of Science in Nursing (BSN)',
        school: 'Northeastern University',
        location: 'Boston, MA',
        graduationYear: '2019',
        details: 'Cum Laude · Clinical Rotation Honors',
      },
    ],
    skills: [
      'Patient Assessment',
      'Clinical Triage',
      'EHR Documentation (Epic)',
      'IV Therapy & Phlebotomy',
      'Medication Administration',
      'Care Coordination',
      'Infection Control',
      'Patient Education',
    ],
    languages: ['English (Native)', 'Portuguese (Fluent)'],
    certifications: ['Registered Nurse License (RN)', 'BLS & ACLS Certified'],
  },
  {
    id: 'project-manager',
    title: 'Project & Operations Manager',
    categoryLabel: 'Operations',
    shortHint: 'Agile/Waterfall delivery, stakeholder alignment & budgets',
    headline: 'PMP-Certified Project & Operations Manager',
    summary:
      'Structured Project Manager experienced in guiding cross-functional software, operations, and vendor implementation programs from scoping to launch. Excels at risk mitigation, milestone tracking, and keeping distributed teams aligned on budget.',
    summarySnippets: [
      'Delivered 14 enterprise client rollouts on schedule with 96% SLA adherence.',
      'Cut operational bottlenecks by standardizing Jira sprint ceremonies and intake triage.',
      'Managed multi-vendor project budgets exceeding $1.2M annually.',
    ],
    experiences: [
      {
        role: 'Operations & Project Manager',
        company: 'Vertex Cloud Solutions',
        location: 'Seattle, WA',
        startDate: 'Feb 2021',
        endDate: 'Present',
        highlights: [
          'Direct cross-functional delivery timelines across engineering, legal, and customer success.',
          'Introduced risk registers and biweekly executive readouts covering scope and burn rate.',
        ],
      },
      {
        role: 'Associate Project Coordinator',
        company: 'Pacific Supply Network',
        location: 'Portland, OR',
        startDate: 'May 2018',
        endDate: 'Jan 2021',
        highlights: [
          'Coordinated warehouse ERP upgrades across four regional distribution centers.',
          'Documented SOP playbooks that halved onboarding time for new coordinators.',
        ],
      },
    ],
    educations: [
      {
        degree: 'B.A. in Business Administration',
        school: 'University of Washington',
        location: 'Seattle, WA',
        graduationYear: '2018',
        details: 'Operations & Supply Chain Concentration',
      },
    ],
    skills: [
      'Program Management',
      'Agile & Scrum',
      'Risk Mitigation',
      'Budget Forecasting',
      'Stakeholder Alignment',
      'Jira & Asana',
      'Process Improvement',
      'Vendor Management',
    ],
    languages: ['English (Fluent)'],
    certifications: ['Project Management Professional (PMP)', 'Certified ScrumMaster (CSM)'],
  },
  {
    id: 'sales-lead',
    title: 'Sales & Business Development Lead',
    categoryLabel: 'Sales',
    shortHint: 'B2B pipeline growth, consultative closing & account expansion',
    headline: 'Senior Account Executive & B2B Sales Lead',
    summary:
      'Results-driven B2B Sales Leader with a consistent track record exceeding annual revenue quotas through consultative discovery, multi-threaded enterprise deals, and long-term client expansion.',
    summarySnippets: [
      'Exceeded annual ARR quota for 3 consecutive years (118% average attainment).',
      'Built $2.4M qualified outbound pipeline via tailored executive outreach and partner referrals.',
      'Increased multi-year contract renewals by aligning quarterly QBR success metrics.',
    ],
    experiences: [
      {
        role: 'Senior Account Executive',
        company: 'PulseWorks CRM',
        location: 'New York, NY',
        startDate: 'Apr 2022',
        endDate: 'Present',
        highlights: [
          'Closed $920K in net-new annual recurring revenue across mid-market and enterprise teams.',
          'Collaborated with solutions engineers to run tailored product demos and ROI workshops.',
        ],
      },
      {
        role: 'Business Development Representative',
        company: 'Beacon Software',
        location: 'Boston, MA',
        startDate: 'Sep 2019',
        endDate: 'Mar 2022',
        highlights: [
          'Ranked top 10% across SDR team for qualified discovery meetings booked monthly.',
          'Maintained clean Salesforce pipeline hygiene and structured outbound cadences.',
        ],
      },
    ],
    educations: [
      {
        degree: 'B.S. in Economics & Communications',
        school: 'Boston University',
        location: 'Boston, MA',
        graduationYear: '2019',
        details: 'Varsity Debate · Business Strategy Minor',
      },
    ],
    skills: [
      'Consultative Selling',
      'Enterprise Negotiation',
      'Pipeline Generation',
      'Salesforce CRM',
      'Account Expansion',
      'Executive Presentations',
      'Contract Renewals',
      'Forecasting',
    ],
    languages: ['English (Native)'],
    certifications: ['MEDDPICC Sales Methodology'],
  },
  {
    id: 'graphic-designer',
    title: 'Graphic & Brand Designer',
    categoryLabel: 'Creative',
    shortHint: 'Visual identity, typography, packaging & campaign assets',
    headline: 'Senior Brand & Visual Graphic Designer',
    summary:
      'Versatile Brand and Graphic Designer crafting memorable visual identities, editorial layouts, packaging systems, and social campaign kits. Balances bold typographic restraint with practical print and digital production accuracy.',
    summarySnippets: [
      'Led full visual rebrands for 10+ emerging consumer and technology startups.',
      'Delivered print-ready packaging files and digital ad toolkits ahead of global launches.',
      'Maintained strict color accuracy across Pantone print runs and web graphics.',
    ],
    experiences: [
      {
        role: 'Brand Designer',
        company: 'Atelier Nine Creative',
        location: 'Melbourne, Australia',
        startDate: 'Feb 2021',
        endDate: 'Present',
        highlights: [
          'Developed brand guidelines, custom iconography, and social campaign systems for clients.',
          'Directed product photography retouching and packaging dielines for retail lines.',
        ],
      },
      {
        role: 'Junior Graphic Designer',
        company: 'Harbor Print & Media',
        location: 'Sydney, Australia',
        startDate: 'May 2018',
        endDate: 'Jan 2021',
        highlights: [
          'Produced exhibition banners, editorial brochures, and digital newsletter layouts.',
          'Prepared CMYK pre-press proofs and coordinated directly with print vendors.',
        ],
      },
    ],
    educations: [
      {
        degree: 'B.A. in Communication Design',
        school: 'RMIT University',
        location: 'Melbourne, Australia',
        graduationYear: '2018',
        details: 'Dean’s Award for Editorial Typography',
      },
    ],
    skills: [
      'Adobe Illustrator',
      'Photoshop & InDesign',
      'Brand Identity',
      'Typography',
      'Print Pre-Press',
      'Packaging Design',
      'Art Direction',
      'Motion Basics',
    ],
    languages: ['English (Fluent)'],
    certifications: ['Adobe Certified Professional'],
  },
  {
    id: 'academic-researcher',
    title: 'Teacher & Academic Researcher',
    categoryLabel: 'Education',
    shortHint: 'Curriculum design, peer-reviewed research & student mentoring',
    headline: 'Lecturer & Academic Curriculum Researcher',
    summary:
      'Dedicated Educator and Researcher with 6+ years teaching undergraduate seminars, designing inquiry-based curricula, and publishing peer-reviewed educational studies. Skilled at mentoring diverse cohorts and fostering critical thinking.',
    summarySnippets: [
      'Co-authored 5 peer-reviewed journal articles on applied STEM pedagogy.',
      'Achieved 4.8/5.0 student evaluation ratings across 18 taught semester courses.',
      'Secured $85K departmental research grant for open educational resources.',
    ],
    experiences: [
      {
        role: 'Lecturer & Curriculum Coordinator',
        company: 'Midlands Institute of Technology',
        location: 'Birmingham, UK',
        startDate: 'Sep 2021',
        endDate: 'Present',
        highlights: [
          'Teach weekly lectures and laboratory workshops for 140+ undergraduate students.',
          'Redesigned syllabus rubrics and formative assessments, raising pass rates by 11%.',
        ],
      },
      {
        role: 'Graduate Teaching Assistant',
        company: 'University of Sheffield',
        location: 'Sheffield, UK',
        startDate: 'Sep 2018',
        endDate: 'Jul 2021',
        highlights: [
          'Led tutorial seminars, graded coursework, and supervised capstone research theses.',
          'Managed academic ethics documentation and survey datasets.',
        ],
      },
    ],
    educations: [
      {
        degree: 'M.Phil. in Education & Applied Sciences',
        school: 'University of Sheffield',
        location: 'Sheffield, UK',
        graduationYear: '2021',
        details: 'Thesis: Interactive Learning Analytics in Higher Education',
      },
      {
        degree: 'B.Sc. in Applied Mathematics',
        school: 'University of Nottingham',
        location: 'Nottingham, UK',
        graduationYear: '2018',
        details: 'Upper Second Class Honors',
      },
    ],
    skills: [
      'Curriculum Design',
      'Academic Writing',
      'Quantitative Research',
      'Student Advising',
      'Grant Proposals',
      'Workshop Facilitation',
      'LMS Platforms',
      'LaTeX & R',
    ],
    languages: ['English (Fluent)', 'German (Reading)'],
    certifications: ['Fellow of the Higher Education Academy (FHEA)'],
  },
  {
    id: 'civil-engineer',
    title: 'Civil & Structural Engineer',
    categoryLabel: 'Engineering',
    shortHint: 'Structural CAD, site inspections, BOQ estimation & safety codes',
    headline: 'Chartered Civil & Structural Site Engineer',
    summary:
      'Practical Civil Engineer with 5+ years managing structural analysis, reinforced concrete detailing, site quality inspections, and contractor coordination. Focused on Eurocode/ACI safety compliance and timely milestone handover.',
    summarySnippets: [
      'Supervised structural concrete pours and steel erection for $24M commercial builds.',
      'Reduced material waste by 9% through precise rebar scheduling and BOQ verification.',
      'Zero lost-time safety incidents across 18 consecutive months of site supervision.',
    ],
    experiences: [
      {
        role: 'Project Civil Engineer',
        company: 'Bridgeway Infrastructure Ltd.',
        location: 'Kuala Lumpur, Malaysia',
        startDate: 'Jan 2022',
        endDate: 'Present',
        highlights: [
          'Review structural shop drawings, approve RFIs, and verify foundation load test records.',
          'Coordinate weekly progress schedules between subcontractors and municipal inspectors.',
        ],
      },
      {
        role: 'Site Engineer',
        company: 'Horizon Builders',
        location: 'Penang, Malaysia',
        startDate: 'Jul 2019',
        endDate: 'Dec 2021',
        highlights: [
          'Conducted concrete slump tests, rebar cover checks, and daily site safety briefings.',
          'Prepared monthly interim payment valuations and quantity take-offs.',
        ],
      },
    ],
    educations: [
      {
        degree: 'B.Eng. (Hons) in Civil Engineering',
        school: 'Universiti Teknologi Malaysia',
        location: 'Johor Bahru, Malaysia',
        graduationYear: '2019',
        details: 'CGPA 3.74/4.0 · Structural Design Capstone',
      },
    ],
    skills: [
      'AutoCAD & Revit',
      'ETABS / STAAD.Pro',
      'Structural Detailing',
      'Site Supervision',
      'BOQ & Cost Estimation',
      'QA/QC Inspections',
      'HSE Compliance',
      'MS Project',
    ],
    languages: ['English (Fluent)', 'Malay (Fluent)'],
    certifications: ['OSHA 30-Hour Construction Safety'],
  },
  {
    id: 'customer-success',
    title: 'Customer Success & Support Lead',
    categoryLabel: 'Support',
    shortHint: 'Client onboarding, retention playbooks & SLA escalation resolution',
    headline: 'Customer Success & Technical Support Lead',
    summary:
      'Empathetic Customer Success Lead skilled in guiding SaaS accounts from onboarding to renewal, building self-service knowledge bases, and resolving escalated technical tickets with fast, clear communication.',
    summarySnippets: [
      'Maintained 97% CSAT and 94% net dollar retention across a 65-account portfolio.',
      'Authored 50+ help-center guides that deflected 28% of repetitive L1 tickets.',
      'Trained 8 support specialists on empathetic de-escalation and bug reproduction.',
    ],
    experiences: [
      {
        role: 'Customer Success Manager',
        company: 'RelayDesk Cloud',
        location: 'Remote / Dublin',
        startDate: 'May 2021',
        endDate: 'Present',
        highlights: [
          'Lead kickoff onboarding sessions, adoption reviews, and annual renewal discussions.',
          'Surface product usability themes directly to engineering sprint planning.',
        ],
      },
      {
        role: 'Senior Support Specialist',
        company: 'CloudHaven Apps',
        location: 'Dublin, Ireland',
        startDate: 'Aug 2018',
        endDate: 'Apr 2021',
        highlights: [
          'Resolved 45+ daily technical inquiries via Zendesk with a 96% first-contact resolution rate.',
          'Created macro libraries and troubleshooting flowcharts for API webhook setups.',
        ],
      },
    ],
    educations: [
      {
        degree: 'B.A. in Business & Digital Media',
        school: 'Dublin City University',
        location: 'Dublin, Ireland',
        graduationYear: '2018',
        details: 'Second Class Honors, Grade I',
      },
    ],
    skills: [
      'Client Onboarding',
      'Account Retention',
      'Zendesk & Intercom',
      'Knowledge Base Writing',
      'QBR Presentations',
      'API Troubleshooting',
      'CRM Hygiene',
      'Team Coaching',
    ],
    languages: ['English (Native)', 'Spanish (Fluent)'],
    certifications: ['ITIL Foundation Certified'],
  },
] as const;

export const BLANK_PROFESSION_PRESET: ProfessionPreset = {
  id: 'custom-blank',
  title: 'Custom / Start Blank',
  categoryLabel: 'Flexible',
  shortHint: 'Start with clean empty fields and build every section yourself',
  headline: 'Your Professional Role Title',
  summary:
    'Motivated specialist with hands-on experience delivering measurable outcomes, collaborating cleanly across teams, and solving practical challenges.',
  summarySnippets: [
    'Delivered measurable improvements in quality, speed, and customer satisfaction.',
    'Collaborated across teams to ship reliable results ahead of deadlines.',
  ],
  experiences: [
    {
      role: 'Your Job Title',
      company: 'Company Name',
      location: 'City, Country',
      startDate: 'Jan 2023',
      endDate: 'Present',
      highlights: ['Describe a key responsibility or measurable outcome you delivered.'],
    },
  ],
  educations: [
    {
      degree: 'Degree or Diploma Title',
      school: 'University or School Name',
      location: 'City, Country',
      graduationYear: '2022',
      details: 'Major, honors, or relevant coursework',
    },
  ],
  skills: ['Communication', 'Problem Solving', 'Project Delivery'],
  languages: ['English (Fluent)'],
  certifications: [],
};

export function getProfessionPresetById(id: string): ProfessionPreset {
  if (id === BLANK_PROFESSION_PRESET.id) {
    return BLANK_PROFESSION_PRESET;
  }
  return PROFESSION_PRESETS.find((p) => p.id === id) ?? PROFESSION_PRESETS[0];
}

export function createCvFormFromPreset(
  professionId: string,
  templateId = 'obsidian-rail',
): CvFormData {
  const preset = getProfessionPresetById(professionId);
  return {
    templateId,
    professionId: preset.id,
    personal: {
      fullName: 'Alex Morgan',
      headline: preset.headline,
      email: 'alex.morgan@example.com',
      phone: '+1 (555) 234-8910',
      location: preset.experiences[0]?.location ?? 'London, UK',
      website: 'linkedin.com/in/alex-morgan',
      photoDataUrl: null,
    },
    summary: preset.summary,
    experiences: preset.experiences.map((exp, idx) => ({
      id: `exp-${preset.id}-${idx + 1}`,
      role: exp.role,
      company: exp.company,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      highlights: [...exp.highlights],
    })),
    educations: preset.educations.map((edu, idx) => ({
      id: `edu-${preset.id}-${idx + 1}`,
      degree: edu.degree,
      school: edu.school,
      location: edu.location,
      graduationYear: edu.graduationYear,
      details: edu.details,
    })),
    skills: [...preset.skills],
    languages: [...preset.languages],
    certifications: [...preset.certifications],
  };
}
