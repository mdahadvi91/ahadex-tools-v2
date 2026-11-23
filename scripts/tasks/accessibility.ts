/**
 * Delegates `npm run audit:accessibility` cleanly to the real WCAG/ARIA audit
 * implemented in `scripts/validation/validate-accessibility.ts`.
 */

import { runAccessibilityValidation } from '../validation/validate-accessibility';
import { assertReportPassed } from '../utils/validation-utils';

const strict = process.argv.includes('--strict');
const report = await runAccessibilityValidation();
assertReportPassed(report, strict);
