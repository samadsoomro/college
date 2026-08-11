const fs = require('fs');
const path = require('path');

function processKarachi() {
  const file = path.join(__dirname, '../src/pages/KarachiPopulationModel.tsx');
  let content = fs.readFileSync(file, 'utf8');

  // 1. Add import
  if (!content.includes('PrintButton')) {
    content = content.replace(
      "import { useParams, Link } from 'react-router-dom';",
      "import { useParams, Link } from 'react-router-dom';\nimport { PrintButton } from '@/components/PrintButton';"
    );
  }

  // 2. Add wrapper
  content = content.replace(
    '<div className="min-h-screen',
    '<div className="research-print-content min-h-screen'
  );

  // 3. Header + Buttons
  const oldHeader = `{/* Back */}
        <Link to={\`/\${collegeSlug}/projects\`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-xl hover:shadow-sm transition-all">
          <ArrowLeft size={16} /> Back to Projects
        </Link>`;

  const newHeader = `{/* Back button — hidden on print */}
        <div className="flex items-center justify-between print-hide">
          <Link to={\`/\${collegeSlug}/projects\`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-xl hover:shadow-sm transition-all">
            <ArrowLeft size={16} /> Back to Projects
          </Link>

          {/* Print Button */}
          <PrintButton label="Print Research (A4)" />
        </div>

        {/* Print-only header (shows only when printing) */}
        <div className="print-only hidden">
          <div className="research-hero-print">
            <h1 style={{ color: 'white', fontSize: '16pt', fontWeight: 'bold', marginBottom: '6px' }}>
              Modeling and Predicting Population Growth of Karachi Using Differential Equations
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '10pt' }}>
              Abdul Samad & Muhammad Salman Bhatti — Class 12 (Mathematics), Batch 2024–2026
            </p>
            <p style={{ color: '#94a3b8', fontSize: '9pt', marginTop: '4px' }}>
              Supervised by: [Prof. Name], Lecturer Mathematics, GCFMN • Published: August 2026
            </p>
            <p style={{ color: '#94a3b8', fontSize: '9pt' }}>
              Mathematics Department — Govt. College for Men Nazimabad, Karachi
            </p>
          </div>
        </div>`;
  content = content.replace(oldHeader, newHeader);

  // 4. Update all Sections
  content = content.replace(/<Section icon={([^}]+)} title="([^"]+)">/g, '<Section icon={$1} title="$2" className="print-no-break">');
  content = content.replace(/<Section icon={Calculator} title="The Mathematical Model" className="print-no-break">/, '<Section icon={Calculator} title="The Mathematical Model" className="print-page-break print-no-break">');
  // There is one with className and bgColor
  content = content.replace(
    /className="border-primary\/30">/,
    'className="border-primary/30 print-no-break">'
  );

  // 5. Add Print Footer before the end of max-w-4xl div
  const footerMarker = `{/* Footer */}`;
  const newFooter = `{/* Print Footer — shows only when printing */}
        <div className="print-footer hidden">
          Govt. College for Men Nazimabad (GCFMN), Karachi • Mathematics Department • August 2026 •
          Live at: college-managment-system-coral.vercel.app/gcfm/projects/karachi-population-model
        </div>

        {/* Footer */}`;
  content = content.replace(footerMarker, newFooter);

  fs.writeFileSync(file, content, 'utf8');
  console.log('Karachi updated');
}

function processAI() {
  const file = path.join(__dirname, '../src/pages/AIResearchStudy.tsx');
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('PrintButton')) {
    content = content.replace(
      "import { useParams, Link } from 'react-router-dom';",
      "import { useParams, Link } from 'react-router-dom';\nimport { PrintButton } from '@/components/PrintButton';"
    );
  }

  content = content.replace(
    '<div className="min-h-screen',
    '<div className="research-print-content min-h-screen'
  );

  const oldHeader = `{/* Back button */}
        <Link to={\`/\${collegeSlug}/projects\`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-xl hover:shadow-sm transition-all">
          <ArrowLeft size={16} /> Back to Projects
        </Link>`;

  const newHeader = `{/* Back + Print row */}
        <div className="flex items-center justify-between print-hide">
          <Link to={\`/\${collegeSlug}/projects\`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-xl hover:shadow-sm transition-all">
            <ArrowLeft size={16} /> Back to Projects
          </Link>
          <PrintButton label="Print Research (A4)" />
        </div>

        {/* Print-only header */}
        <div className="print-only hidden">
          <div className="research-hero-print">
            <h1 style={{ color: 'white', fontSize: '16pt', fontWeight: 'bold', marginBottom: '6px' }}>
              AI Tools & Academic Performance Among All Groups Students
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '10pt' }}>
              Abdul Samad — Class 12 (CS), Batch 2024–2026
            </p>
            <p style={{ color: '#94a3b8', fontSize: '9pt', marginTop: '4px' }}>
              {supervisor} • Published: June 2026
            </p>
            <p style={{ color: '#94a3b8', fontSize: '9pt' }}>
              Statistics Department — Govt. College for Men Nazimabad, Karachi
            </p>
          </div>
        </div>`;
  content = content.replace(oldHeader, newHeader);

  content = content.replace(/<Section icon={([^}]+)} title="([^"]+)">/g, '<Section icon={$1} title="$2" className="print-no-break">');

  const footerMarker = `export default AIResearchStudy;`;
  
  // Find the closing div of max-w-4xl
  // It's just before `</div>\n    </div>\n  );\n};`
  content = content.replace(
    /      <\/div>\n    <\/div>\n  \);\n};/,
    `
        {/* Print Footer */}
        <div className="print-footer hidden">
          Govt. College for Men Nazimabad (GCFMN), Karachi • Statistics Department • June 2026 •
          Live at: college-managment-system-coral.vercel.app/gcfm/projects/ai-performance-study
        </div>

      </div>
    </div>
  );
};`
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('AI updated');
}

processKarachi();
processAI();
