import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfileStore } from '@/store/profileStore';
import { useReportingStore } from '@/store/reportingStore';
import { Check, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/Dialog';
import { NativeSelect } from '@/components/ui/Select';

const ROLE_OPTIONS = ['MD', 'Director', 'EA', 'HR', 'Manager', 'Executive'];

const fieldClass =
  'mt-1 block w-full rounded-lg border border-border bg-card py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors';

const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5';

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

// The old /add-employee page, wrapped in a dialog so employee creation lives
// inside the Employees page. Submit/validation logic is unchanged.
export function AddEmployeeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profiles, departments, branches, fetchProfiles } = useProfileStore();
  const { fetchReportingRecords } = useReportingStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'Manager',
    branch: '',
    reportingToIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  function handleOpenChange(o: boolean) {
    if (!o) {
      onClose();
      setError(null);
      setSuccess(null);
    }
  }

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

      const primaryManagerId = formData.reportingToIds[0] || null;
      const { data: newUserId, error: rpcError } = await supabase.rpc('create_employee_full', {
        p_name:             formData.name,
        p_email:            emailLower,
        p_phone_no:         formData.phone || null,
        p_department:       formData.department,
        p_role:             formData.role,
        p_branch:           formData.branch,
        p_reporting_to_id:  primaryManagerId,
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

      // Insert rows into the reporting table for the new employee
      if (newUserId) {
        // Delete any automatically generated row to start fresh
        await supabase.from('reporting').delete().eq('employee_id', newUserId);

        if (formData.reportingToIds.length > 0) {
          const rowsToInsert = formData.reportingToIds.map((managerId) => ({
            employee_id:      newUserId,
            department:       formData.department,
            role:             formData.role,
            branch:           formData.branch,
            reporting_to_id:  managerId,
          }));
          const { error: insErr } = await supabase.from('reporting').insert(rowsToInsert);
          if (insErr) throw insErr;
        } else {
          const { error: insErr } = await supabase.from('reporting').insert({
            employee_id:      newUserId,
            department:       formData.department,
            role:             formData.role,
            branch:           formData.branch,
            reporting_to_id:  null,
          });
          if (insErr) throw insErr;
        }
      }

      setSuccess('Employee created successfully!');
      fetchProfiles();
      fetchReportingRecords();
      setFormData({ name: '', email: '', phone: '', department: '', role: 'Manager', branch: '', reportingToIds: [] });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            <Check size={14} className="shrink-0" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Details</p>
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

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organisation Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Department" required>
                <NativeSelect
                  id="department" name="department"
                  value={formData.department} onChange={handleChange}
                  className={fieldClass}
                >
                  <option value="">— Select Department —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </NativeSelect>
              </Field>
              <Field label="Role" required>
                <NativeSelect
                  id="role" name="role"
                  value={formData.role} onChange={handleChange}
                  className={fieldClass}
                >
                  {ROLE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </NativeSelect>
              </Field>
              <Field label="Branch" required>
                <NativeSelect
                  id="branch" name="branch"
                  value={formData.branch} onChange={handleChange}
                  className={fieldClass}
                >
                  <option value="">— Select Branch —</option>
                  {branches.map((b) => <option key={b.id} value={b.code}>{b.name} ({b.code})</option>)}
                </NativeSelect>
              </Field>
              <Field label="Reports To (Multiple allowed)">
                <div className="mt-1.5 rounded-lg border border-border bg-card p-3 max-h-40 overflow-y-auto space-y-2">
                  {profiles.map((p) => {
                    const isChecked = formData.reportingToIds.includes(p.id)
                    return (
                      <label key={p.id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const newIds = isChecked
                              ? formData.reportingToIds.filter((id) => id !== p.id)
                              : [...formData.reportingToIds, p.id]
                            setFormData((prev) => ({ ...prev, reportingToIds: newIds }))
                          }}
                          className="rounded border-border text-primary focus:ring-primary/30"
                        />
                        <span>{p.full_name}</span>
                      </label>
                    )
                  })}
                </div>
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setFormData({ name: '', email: '', phone: '', department: '', role: 'Manager', branch: '', reportingToIds: [] });
                setError(null); setSuccess(null);
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting
                ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                : <><UserPlus size={14} /> Create Employee</>
              }
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
