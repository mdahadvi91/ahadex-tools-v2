interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onFinish?: () => void;
  canProceed?: boolean;
  loading?: boolean;
  backLabel?: string;
  nextLabel?: string;
  finishLabel?: string;
}

export default function WizardNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onFinish,
  canProceed = true,
  loading = false,
  backLabel = 'Back',
  nextLabel = 'Next',
  finishLabel = 'Finish',
}: WizardNavigationProps) {
  const isFirst = currentStep === 1;
  const isLast = currentStep === totalSteps;

  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst || loading}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ← {backLabel}
      </button>

      <span className="text-xs text-slate-500">
        Step {currentStep} of {totalSteps}
      </span>

      {isLast && onFinish ? (
        <button
          type="button"
          onClick={onFinish}
          disabled={!canProceed || loading}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Processing...' : finishLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed || loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {nextLabel} →
        </button>
      )}
    </div>
  );
}
