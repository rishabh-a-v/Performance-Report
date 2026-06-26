import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfileStore } from '@/store/profileStore';
import { useReportingStore } from '@/store/reportingStore';
import { useAuth } from '@/contexts/AuthContext';
import { Check, AlertCircle, Loader2, UserPlus } from 'lucide-react';

const ROLE_OPTIONS = ['MD', 'Director', 'EA', 'Manager', 'Executive'];

const fieldClass =
  'mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-colors';

const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export const AddEmployee = () => {
  const { role: currentUserRole } = useAuth();
  const { profiles, departments, branches, fetchProfiles, fetchDepartments, fetchBranches } = useProfileStore();
  const { fetchReportingRecords } = useReportingStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'Manager',
    branch: '',
    reportingTo: '' as string | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { fetchProfiles(); fetchDepartments(); fetchBranches() }, []);

  if (!['managing_director', 'executive_assistant', 'director'].includes(currentUserRole ?? '')) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
        <AlertCircle size={16} className="shrink-0" />
        You do not have permission to add employees.
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name || !formData.email || !formData.department || !formData.role || !formData.branch) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const emailLower = formData.email.trim().toLowerCase();

      const { data: emailMatch } = await supabase
        .from('profiles').select('id').ilike('email', emailLower).maybeSingle();
      if (emailMatch) { setError('An employee with this email already exists.'); setSubmitting(false); return; }

      if (formData.phone.trim()) {
        const { data: phoneMatch } = await supabase
          .from('profiles').select('id').eq('phone_no', formData.phone.trim()).maybeSingle();
        if (phoneMatch) { setError('An employee with this mobile number already exists.'); setSubmitting(false); return; }
      }

      const { error: rpcError } = await supabase.rpc('create_employee_full', {
        p_name:             formData.name,
        p_email:            emailLower,
        p_phone_no:         formData.phone || null,
        p_department:       formData.department,
        p_role:             formData.role,
        p_branch:           formData.branch,
        p_reporting_to_id:  formData.reportingTo || null,
      });

      if (rpcError) {
        const msg = rpcError.message;
        if (msg.includes('duplicate_email') || (msg.includes('already exists') && msg.includes('email')) || msg.includes('profiles_email_key')) {
          setError('An employee with this email already exists.');
        } else if (msg.includes('duplicate_phone') || (msg.includes('already exists') && msg.includes('mobile')) || msg.includes('profiles_phone_no_unique') || (msg.includes('unique') && msg.includes('phone'))) {
          setError('An employee with this mobile number already exists.');
        } else {
          setError(msg);
        }
        setSubmitting(false);
        return;
      }

      setSuccess('Employee created successfully!');
      fetchProfiles();
      fetchReportingRecords();
      setFormData({ name: '', email: '', phone: '', department: '', role: 'Manager', branch: '', reportingTo: null });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Employee</h1>
        <p className="mt-1 text-sm text-slate-500">Create a new employee account and assign their role and reporting line.</p>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          <Check size={14} className="shrink-0" /> {success}
        </div>
      )}

      {/* Form card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">

          {/* Personal details section */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Personal Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name" required>
                <input
                  id="name" name="name" type="text"
                  value={formData.name} onChange={handleChange} required
                  placeholder="e.g. Arjun Sharma"
                  className={fieldClass}
                />
              </Field>
              <Field label="Email" required>
                <input
                  id="email" name="email" type="email"
                  value={formData.email} onChange={handleChange} required
                  placeholder="arjun@transworld.com"
                  className={fieldClass}
                />
              </Field>
              <Field label="Phone No">
                <input
                  id="phone" name="phone" type="tel"
                  value={formData.phone} onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className={fieldClass}
                />
              </Field>
            </div>
          </div>

          {/* Organisation details section */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Organisation Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Department" required>
                <select
                  id="department" name="department"
                  value={formData.department} onChange={handleChange} required
                  className={fieldClass}
                >
                  <option value="">— Select Department —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Role" required>
                <select
                  id="role" name="role"
                  value={formData.role} onChange={handleChange} required
                  className={fieldClass}
                >
                  {ROLE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </Field>
              <Field label="Branch" required>
                <select
                  id="branch" name="branch"
                  value={formData.branch} onChange={handleChange} required
                  className={fieldClass}
                >
                  <option value="">— Select Branch —</option>
                  {branches.map((b) => <option key={b.id} value={b.code}>{b.name} ({b.code})</option>)}
                </select>
              </Field>
              <Field label="Reporting To">
                <select
                  id="reportingTo" name="reportingTo"
                  value={formData.reportingTo ?? ''} onChange={handleChange}
                  className={fieldClass}
                >
                  <option value="">— None —</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Submit row */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 rounded-b-xl">
            <button
              type="button"
              onClick={() => {
                setFormData({ name: '', email: '', phone: '', department: '', role: 'Manager', branch: '', reportingTo: null });
                setError(null); setSuccess(null);
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting
                ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                : <><UserPlus size={14} /> Create Employee</>
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
