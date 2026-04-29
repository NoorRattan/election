/**
 * Profile page — route /profile (ProtectedRoute)
 *
 * UPDATED (Prompt 06 — GAP-06):
 * Added Analytics Consent subsection in the Settings section.
 * Uses ConsentToggle component. Reads/writes localStorage key
 * "electra_analytics_consent" and syncs gdpr_consent_at to backend on enable.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useCountry } from '../contexts/CountryContext';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConsentToggle from '../components/ui/ConsentToggle';

const ANALYTICS_CONSENT_KEY = 'electra_analytics_consent';

const AGE_GROUPS = [
  { value: '',        label: 'Prefer not to say' },
  { value: '18-24',   label: '18–24' },
  { value: '25-34',   label: '25–34' },
  { value: '35-44',   label: '35–44' },
  { value: '45-54',   label: '45–54' },
  { value: '55-64',   label: '55–64' },
  { value: '65+',     label: '65 and over' },
];

export default function Profile() {
  const { signOut } = useAuth();
  const { setCountry } = useCountry();
  const navigate = useNavigate();

  const [profile,  setProfile]  = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Settings state
  const [analyticsConsent, setAnalyticsConsentState] = useState(
    () => localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'true'
  );

  useEffect(() => {
    document.title = 'My Profile | Electra';
    Promise.all([userApi.getProfile(), userApi.getProgress()])
      .then(([p, pr]) => {
        setProfile(p);
        setProgress(pr.progress || []);

        // Sync analytics consent from server (server is authoritative across devices).
        // If gdpr_consent_at is set on the server and localStorage doesn't reflect it,
        // seed localStorage so analytics.js activates on the next render.
        // We intentionally do NOT clear consent if the server field is null —
        // the field may be missing for users who consented before this feature launched.
        //
        // FIX (Prompt 10 — GAP-02): Read localStorage directly instead of the
        // analyticsConsent React state variable. The state value is captured at
        // effect creation time (always the initial value with [] deps), making it
        // a stale closure. localStorage.getItem() always reflects the current value.
        // The [] dependency array is now correct — no external state is captured.
        const serverConsented = !!p.gdpr_consent_at;
        const alreadyConsented = localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'true';
        if (serverConsented && !alreadyConsented) {
          localStorage.setItem(ANALYTICS_CONSENT_KEY, 'true');
          setAnalyticsConsentState(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await userApi.deleteAccount();
      await signOut();
      setCountry(null);
      navigate('/');
    } catch { setDeleting(false); setShowDeleteModal(false); }
  }

  function handleConsentChange(val) {
    setAnalyticsConsentState(val);
    if (val) {
      localStorage.setItem(ANALYTICS_CONSENT_KEY, 'true');
      // Sync gdpr_consent_at to backend — fire-and-forget
      userApi.updateProfile({ gdpr_consent_at: new Date().toISOString() }).catch(() => {
        // Non-fatal — consent is still recorded in localStorage
      });
    } else {
      localStorage.removeItem(ANALYTICS_CONSENT_KEY);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20" role="status" aria-label="Loading profile">
        <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-primary-600" aria-hidden="true" />
      </div>
    );
  }
  if (!profile) return null;

  const pct = profile.stats.total_topics > 0
    ? Math.round((profile.stats.topics_completed / profile.stats.total_topics) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold text-neutral-900">My Profile</h1>

      {/* ── Account info ─────────────────────────────────────────────── */}
      <section aria-labelledby="profile-info">
        <h2 id="profile-info" className="text-xl font-semibold text-neutral-800 mb-4">Account</h2>
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-2">
          <p className="text-neutral-900 font-medium">{profile.display_name || 'No name set'}</p>
          <p className="text-sm text-neutral-500">{profile.email}</p>
          {profile.country && <Badge variant="info">{profile.country}</Badge>}
        </div>
      </section>

      {/* ── Learning stats ───────────────────────────────────────────── */}
      <section aria-labelledby="profile-stats">
        <h2 id="profile-stats" className="text-xl font-semibold text-neutral-800 mb-4">Learning Stats</h2>
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
          <ProgressBar
            value={pct}
            label={`${profile.stats.topics_completed} of ${profile.stats.total_topics} topics completed`}
            ariaLabel="Topic completion progress"
          />
          <p className="text-sm text-neutral-600">
            Average quiz score: <strong>{profile.stats.average_quiz_score}%</strong>
          </p>
        </div>
      </section>

      {/* ── Progress list ────────────────────────────────────────────── */}
      {progress.length > 0 && (
        <section aria-labelledby="profile-progress">
          <h2 id="profile-progress" className="text-xl font-semibold text-neutral-800 mb-4">My Progress</h2>
          <ul className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
            {progress.map((p) => (
              <li key={p.topic_id} className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-neutral-800 capitalize">{p.topic_id.replace(/-/g, ' ')}</span>
                <div className="flex items-center gap-3">
                  {p.completed && <Badge variant="success">✓ Done</Badge>}
                  {p.quiz_score !== null && <span className="text-sm text-neutral-500">{p.quiz_score}%</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Settings ─────────────────────────────────────────────────── */}
      <section aria-labelledby="profile-settings">
        <h2 id="profile-settings" className="text-xl font-semibold text-neutral-800 mb-4">Settings</h2>
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">

          {/* Country preference */}
          <div>
            <label htmlFor="profile-country" className="block text-sm font-medium text-neutral-700 mb-1">
              Country
            </label>
            <select
              id="profile-country"
              defaultValue={profile.country || ''}
              onChange={(e) => {
                setCountry(e.target.value || null);
                userApi.updateProfile({ country: e.target.value || null }).catch(() => {});
              }}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 focus:outline-2 focus:outline-primary-600 bg-white"
            >
              <option value="">No preference</option>
              <option value="UK">United Kingdom</option>
              <option value="US">United States</option>
              <option value="IN">India</option>
            </select>
          </div>

          {/* Age group */}
          <div>
            <label htmlFor="profile-age-group" className="block text-sm font-medium text-neutral-700 mb-1">
              Age Group
            </label>
            <select
              id="profile-age-group"
              defaultValue={profile.age_group || ''}
              onChange={(e) => {
                userApi.updateProfile({ age_group: e.target.value || null }).catch(() => {});
              }}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 focus:outline-2 focus:outline-primary-600 bg-white"
            >
              {AGE_GROUPS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* ── Analytics & Privacy ───────────────────────────────────── */}
          <div className="border-t border-neutral-100 pt-4">
            <h3 className="text-sm font-semibold text-neutral-800 mb-2">Analytics & Privacy</h3>
            <ConsentToggle
              id="analytics-consent"
              label="Usage Analytics"
              description="Help us improve Electra by sharing anonymised usage data with Firebase Analytics. You can change this at any time. See our Privacy Policy for details."
              checked={analyticsConsent}
              onChange={handleConsentChange}
            />
          </div>

        </div>
      </section>

      {/* ── Danger zone ──────────────────────────────────────────────── */}
      <section aria-labelledby="profile-account">
        <h2 id="profile-account" className="text-xl font-semibold text-neutral-800 mb-4">Danger Zone</h2>
        <div className="bg-white rounded-xl border border-error-200 p-6">
          <p className="text-sm text-neutral-600 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>Delete My Account</Button>
        </div>
      </section>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        id="delete-modal"
      >
        <p className="text-neutral-600 mb-6">
          This will permanently delete all your data including progress and quiz scores. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDeleteAccount} className="flex-1">
            Yes, Delete Everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}
