import { useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import usePrediction from '../hooks/usePrediction';
import UpgradeModal from '../components/UpgradeModal/UpgradeModal';
import './Predict.css';

const STEPS = ['Personal Details', 'Loan Details', 'Credit Info'];

// ── Sample data for testing (all monetary values in ₹ INR) ──────────────────
const SAMPLE_DATA = {
  LOW: {
    label: 'Low Risk Sample',
    data: {
      applicant_name: 'Ramesh Kumar (Low Risk)',
      LIMIT_BAL: 540000, AGE: 35,
      SEX: 2, EDUCATION: 1, MARRIAGE: 1,
      PAY_0: -1, PAY_2: -1, PAY_3: -1, PAY_4: -1, PAY_5: -1, PAY_6: -1,
      BILL_AMT1: 13500, BILL_AMT2: 12960, BILL_AMT3: 12150,
      BILL_AMT4: 11340, BILL_AMT5: 10800, BILL_AMT6: 10260,
      PAY_AMT1: 13500, PAY_AMT2: 12960, PAY_AMT3: 12150,
      PAY_AMT4: 11340, PAY_AMT5: 10800, PAY_AMT6: 10260,
    }
  },
  MEDIUM: {
    label: 'Medium Risk Sample',
    data: {
      applicant_name: 'Priya Singh (Medium Risk)',
      LIMIT_BAL: 216000, AGE: 42,
      SEX: 1, EDUCATION: 2, MARRIAGE: 2,
      PAY_0: 0, PAY_2: 0, PAY_3: 0, PAY_4: 0, PAY_5: 0, PAY_6: 0,
      BILL_AMT1: 108000, BILL_AMT2: 102600, BILL_AMT3: 97200,
      BILL_AMT4: 91800, BILL_AMT5: 86400, BILL_AMT6: 81000,
      PAY_AMT1: 5400, PAY_AMT2: 4860, PAY_AMT3: 4050,
      PAY_AMT4: 3240, PAY_AMT5: 2700, PAY_AMT6: 2160,
    }
  },
  HIGH: {
    label: 'High Risk Sample',
    data: {
      applicant_name: 'Ajay Verma (High Risk)',
      LIMIT_BAL: 81000, AGE: 28,
      SEX: 1, EDUCATION: 3, MARRIAGE: 2,
      PAY_0: 2, PAY_2: 2, PAY_3: 3, PAY_4: 3, PAY_5: 2, PAY_6: 2,
      BILL_AMT1: 78300, BILL_AMT2: 76950, BILL_AMT3: 75600,
      BILL_AMT4: 74250, BILL_AMT5: 72900, BILL_AMT6: 71550,
      PAY_AMT1: 0, PAY_AMT2: 0, PAY_AMT3: 1350,
      PAY_AMT4: 0, PAY_AMT5: 0, PAY_AMT6: 810,
    }
  }
};

const PAY_OPTIONS = [
  { value: -2, label: '-2: No consumption' },
  { value: -1, label: '-1: Paid in full' },
  { value: 0, label: '0: Use of revolving credit' },
  { value: 1, label: '1: Delayed 1 month' },
  { value: 2, label: '2: Delayed 2 months' },
  { value: 3, label: '3: Delayed 3 months' },
  { value: 4, label: '4: Delayed 4 months' },
  { value: 5, label: '5: Delayed 5 months' },
  { value: 6, label: '6: Delayed 6 months' },
  { value: 7, label: '7: Delayed 7+ months' },
];

const STEP_1_FIELDS = [
  { key: 'applicant_name', label: 'Applicant Name', placeholder: 'e.g. Rajesh Sharma', type: 'text', tooltip: 'Full name of the loan applicant', required: true },
  { key: 'LIMIT_BAL', label: 'Credit Limit (₹)', placeholder: 'e.g. 5,00,000', type: 'number', tooltip: 'Credit limit sanctioned in Indian Rupees' },
  { key: 'AGE', label: 'Age (Years)', placeholder: 'e.g. 35', type: 'number', tooltip: 'Age in years' },
  {
    key: 'SEX', label: 'Gender', type: 'select', tooltip: 'Biological sex of applicant',
    options: [{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }]
  },
  {
    key: 'EDUCATION', label: 'Education Level', type: 'select', tooltip: 'Highest education attained',
    options: [
      { value: 1, label: 'Graduate School' }, { value: 2, label: 'University' },
      { value: 3, label: 'High School' }, { value: 4, label: 'Other' },
    ]
  },
  {
    key: 'MARRIAGE', label: 'Marital Status', type: 'select', tooltip: 'Current marital status',
    options: [
      { value: 1, label: 'Married' }, { value: 2, label: 'Single' },
      { value: 3, label: 'Other' }, { value: 0, label: 'Unknown' },
    ]
  },
];

const STEP_2_FIELDS = [
  { key: 'PAY_0', label: 'Repayment Status — Sep', type: 'select', options: PAY_OPTIONS, tooltip: 'Payment status in September (most recent)' },
  { key: 'PAY_2', label: 'Repayment Status — Aug', type: 'select', options: PAY_OPTIONS, tooltip: 'Payment status in August' },
  { key: 'PAY_3', label: 'Repayment Status — Jul', type: 'select', options: PAY_OPTIONS, tooltip: 'Payment status in July' },
  { key: 'PAY_4', label: 'Repayment Status — Jun', type: 'select', options: PAY_OPTIONS, tooltip: 'Payment status in June' },
  { key: 'PAY_5', label: 'Repayment Status — May', type: 'select', options: PAY_OPTIONS, tooltip: 'Payment status in May' },
  { key: 'PAY_6', label: 'Repayment Status — Apr', type: 'select', options: PAY_OPTIONS, tooltip: 'Payment status in April' },
];

const STEP_3_FIELDS = [
  { key: 'BILL_AMT1', label: 'Bill Amount - Sep (\u20b9)', placeholder: 'e.g. 27,000', type: 'number' },
  { key: 'BILL_AMT2', label: 'Bill Amount - Aug (\u20b9)', placeholder: 'e.g. 24,300', type: 'number' },
  { key: 'BILL_AMT3', label: 'Bill Amount - Jul (\u20b9)', placeholder: 'e.g. 22,950', type: 'number' },
  { key: 'BILL_AMT4', label: 'Bill Amount - Jun (\u20b9)', placeholder: 'e.g. 18,900', type: 'number' },
  { key: 'BILL_AMT5', label: 'Bill Amount - May (\u20b9)', placeholder: 'e.g. 17,550', type: 'number' },
  { key: 'BILL_AMT6', label: 'Bill Amount - Apr (\u20b9)', placeholder: 'e.g. 13,500', type: 'number' },
  { key: 'PAY_AMT1', label: 'Payment Made - Sep (\u20b9)', placeholder: 'e.g. 5,400', type: 'number' },
  { key: 'PAY_AMT2', label: 'Payment Made - Aug (\u20b9)', placeholder: 'e.g. 4,860', type: 'number' },
  { key: 'PAY_AMT3', label: 'Payment Made - Jul (\u20b9)', placeholder: 'e.g. 4,050', type: 'number' },
  { key: 'PAY_AMT4', label: 'Payment Made - Jun (\u20b9)', placeholder: 'e.g. 3,240', type: 'number' },
  { key: 'PAY_AMT5', label: 'Payment Made - May (\u20b9)', placeholder: 'e.g. 2,700', type: 'number' },
  { key: 'PAY_AMT6', label: 'Payment Made - Apr (\u20b9)', placeholder: 'e.g. 2,160', type: 'number' },
];


const STEPS_FIELDS = [STEP_1_FIELDS, STEP_2_FIELDS, STEP_3_FIELDS];

function Tooltip({ text }) {
  return (
    <span className="form-tooltip" title={text}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </span>
  );
}

export default function Predict() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [sampleOpen, setSampleOpen] = useState(false);
  const { predict, loading, error, planLimitReached, clearPlanLimit } = usePrediction();

  const currentFields = STEPS_FIELDS[step];

  const handleChange = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
  };

  const loadSample = (key) => {
    setForm(SAMPLE_DATA[key].data);
    setErrors({});
    setSampleOpen(false);
    setStep(0);
  };

  const validate = () => {
    const newErrors = {};
    currentFields.forEach(f => {
      const val = form[f.key];
      if (val === undefined || val === '' || val === null) {
        newErrors[f.key] = 'Required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validate()) setStep(s => s + 1); };
  const handleBack = () => setStep(s => s - 1);
  const handleSubmit = () => { if (validate()) predict(form); };

  return (
    <div className="predict-page">
      <Navbar />
      <div className="predict-bg">
        <div className="predict-bg__glow" />
        <div className="predict-bg__glow predict-bg__glow--2" />
      </div>

      <div className="container predict-container">
        {/* Header */}
        <div className="predict-header">
          <div className="predict-lock-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="predict-header__title">Borrower Data Input</h1>
            <p className="predict-header__sub">Enter the applicant's financial information for risk assessment (Values in NT$ — New Taiwan Dollar)</p>
          </div>
          {/* Sample Data Picker */}
          <div className="sample-picker" style={{ position: 'relative' }}>
            <button className="sample-picker-btn" onClick={() => setSampleOpen(o => !o)} id="sample-data-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
              Load Sample Data
            </button>
            {sampleOpen && (
              <div className="sample-dropdown">
                <div className="sample-dropdown__label">Select risk scenario:</div>
                {Object.entries(SAMPLE_DATA).map(([key, s]) => (
                  <button key={key} className={`sample-option sample-option--${key.toLowerCase()}`}
                    onClick={() => loadSample(key)} id={`sample-${key.toLowerCase()}`}>
                    <span className={`sample-dot sample-dot--${key.toLowerCase()}`} />
                    {s.label}
                  </button>
                ))}
                <div className="sample-dropdown__note">
                  ⚠️ Sample values are for testing only (NT$ amounts)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={i} className="stepper__item">
              <div className={`stepper__circle ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
                {i < step ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`stepper__line ${i < step ? 'done' : ''}`} />}
              <span className={`stepper__label ${i === step ? 'active' : ''}`}>{s}</span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="predict-card">
          <div className="predict-card__step-label">Step {step + 1} of {STEPS.length}</div>
          <h2 className="predict-card__heading">{STEPS[step]}</h2>

          {error && (
            <div className="predict-error-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="predict-form-grid">
            {currentFields.map((field) => (
              <div className={`form-group ${field.key === 'applicant_name' ? 'form-group--full' : ''}`} key={field.key}>
                <label className="form-label" htmlFor={field.key}>
                  {field.label}
                  {field.tooltip && <Tooltip text={field.tooltip} />}
                </label>
                {field.type === 'select' ? (
                  <select id={field.key} className={`form-control ${errors[field.key] ? 'form-control--error' : ''}`}
                    value={form[field.key] ?? ''}
                    onChange={e => handleChange(field.key, e.target.value)}>
                    <option value="">Select...</option>
                    {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input id={field.key} type={field.type}
                    className={`form-control ${errors[field.key] ? 'form-control--error' : ''}`}
                    placeholder={field.placeholder}
                    value={form[field.key] ?? ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    min={field.type === 'number' ? undefined : undefined}
                  />
                )}
                {errors[field.key] && <span className="form-error-msg">{errors[field.key]}</span>}
              </div>
            ))}
          </div>

          {/* NT$ note */}
          {(step === 0 || step === 2) && (
            <div className="nt-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Monetary values are in <strong>NT$ (New Taiwan Dollar)</strong>. Model trained on UCI Taiwanese credit data. 1 NT$ ≈ ₹2.7 INR.
            </div>
          )}

          {/* Nav Buttons */}
          <div className="predict-nav">
            {step > 0 && (
              <button className="btn-predict-back" onClick={handleBack} disabled={loading}>← Back</button>
            )}
            <div style={{ marginLeft: 'auto' }}>
              {step < STEPS.length - 1 ? (
                <button className="btn btn-primary predict-next-btn" onClick={handleNext} id="predict-next-btn">
                  Next
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              ) : (
                <button className="btn btn-primary predict-submit-btn" onClick={handleSubmit}
                  disabled={loading} id="predict-submit-btn">
                  {loading ? <><span className="spinner" />Analyzing Risk...</> : <>Predict Default Risk</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal — shown when monthly prediction limit is reached */}
      {planLimitReached && (
        <UpgradeModal
          onClose={clearPlanLimit}
          featureName="Monthly Predictions"
          requiredPlan="starter"
          message={`You've used ${planLimitReached.used}/${planLimitReached.limit} predictions this month on the ${planLimitReached.currentPlan} plan. Upgrade to unlock more predictions.`}
        />
      )}
    </div>
  );
}