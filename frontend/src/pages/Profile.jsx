import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useCountry } from '../contexts/CountryContext'
import ProgressBar from '../components/ui/ProgressBar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConsentToggle from '../components/ui/ConsentToggle'

const ANALYTICS_CONSENT_KEY = 'electra_analytics_consent'

const AGE_GROUPS = [
  { value: '', label: 'Prefer not to say' },
  { value: '13-17', label: '13-17' },
  { value: '18-25', label: '18-25' },
  { value: '26-40', label: '26-40' },
  { value: '40+', label: '40 and over' },
]

const VALID_AGE_GROUPS = new Set(AGE_GROUPS.map(({ value }) => value))

export default function Profile() {
  const { signOut } = useAuth()
  const { setCountry } = useCountry()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [form, setForm] = useState({
    display_name: '',
    country: '',
    age_group: '',
  })

  const [analyticsConsent, setAnalyticsConsentState] = useState(
    () => localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'true'
  )

  useEffect(() => {
    document.title = 'My Profile | Electra'
    Promise.all([userApi.getProfile(), userApi.getProgress()])
      .then(([p, pr]) => {
        setProfile(p)
        setProgress(pr.progress || [])
        setForm({
          display_name: p.display_name || '',
          country: p.country || '',
          age_group: VALID_AGE_GROUPS.has(p.age_group) ? p.age_group : '',
        })

        const serverConsented = !!p.gdpr_consent_at
        const alreadyConsented = localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'true'
        if (serverConsented && !alreadyConsented) {
          localStorage.setItem(ANALYTICS_CONSENT_KEY, 'true')
          setAnalyticsConsentState(true)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleProfileSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveMessage('')

    const updates = {
      display_name: form.display_name.trim() || null,
      country: form.country || null,
      age_group: form.age_group || null,
    }

    try {
      await userApi.updateProfile(updates)
      setProfile((current) => ({ ...current, ...updates }))
      setCountry(updates.country)
      setSaveMessage('Profile saved.')
    } catch {
      setSaveMessage('Could not save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await userApi.deleteAccount()
      await signOut()
      setCountry(null)
      navigate('/')
    } catch {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  function handleConsentChange(val) {
    setAnalyticsConsentState(val)
    if (val) {
      localStorage.setItem(ANALYTICS_CONSENT_KEY, 'true')
      userApi.updateProfile({ gdpr_consent_at: new Date().toISOString() }).catch(() => {})
    } else {
      localStorage.removeItem(ANALYTICS_CONSENT_KEY)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20" role="status" aria-label="Loading profile">
        <div
          className="animate-spin h-10 w-10 rounded-full border-b-2 border-primary-600"
          aria-hidden="true"
        />
      </div>
    )
  }
  if (!profile) return null

  const pct =
    profile.stats.total_topics > 0
      ? Math.round((profile.stats.topics_completed / profile.stats.total_topics) * 100)
      : 0

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold text-neutral-900">My Profile</h1>

      <section aria-labelledby="profile-info">
        <h2 id="profile-info" className="text-xl font-semibold text-neutral-800 mb-4">
          Account
        </h2>
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-2">
          <p className="text-neutral-900 font-medium">{profile.display_name || 'No name set'}</p>
          <p className="text-sm text-neutral-500">{profile.email}</p>
          {profile.country && <Badge variant="info">{profile.country}</Badge>}
        </div>
      </section>

      <section aria-labelledby="profile-stats">
        <h2 id="profile-stats" className="text-xl font-semibold text-neutral-800 mb-4">
          Learning Stats
        </h2>
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

      {progress.length > 0 && (
        <section aria-labelledby="profile-progress">
          <h2 id="profile-progress" className="text-xl font-semibold text-neutral-800 mb-4">
            My Progress
          </h2>
          <ul className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
            {progress.map((p) => (
              <li key={p.topic_id} className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-neutral-800 capitalize">
                  {p.topic_id.replace(/-/g, ' ')}
                </span>
                <div className="flex items-center gap-3">
                  {p.completed && <Badge variant="success">Done</Badge>}
                  {p.quiz_score !== null && (
                    <span className="text-sm text-neutral-500">{p.quiz_score}%</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="profile-settings">
        <h2 id="profile-settings" className="text-xl font-semibold text-neutral-800 mb-4">
          Settings
        </h2>
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label
                htmlFor="profile-display-name"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Name
              </label>
              <input
                id="profile-display-name"
                type="text"
                value={form.display_name}
                onChange={(e) =>
                  setForm((current) => ({ ...current, display_name: e.target.value }))
                }
                maxLength={80}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 focus:outline-2 focus:outline-primary-600"
              />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={profile.email || ''}
                disabled
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
              />
            </div>

            <div>
              <label
                htmlFor="profile-country"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Country
              </label>
              <select
                id="profile-country"
                value={form.country}
                onChange={(e) => setForm((current) => ({ ...current, country: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 focus:outline-2 focus:outline-primary-600 bg-white"
              >
                <option value="">No preference</option>
                <option value="UK">United Kingdom</option>
                <option value="US">United States</option>
                <option value="IN">India</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="profile-age-group"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Age Group
              </label>
              <select
                id="profile-age-group"
                value={form.age_group}
                onChange={(e) => setForm((current) => ({ ...current, age_group: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 focus:outline-2 focus:outline-primary-600 bg-white"
              >
                {AGE_GROUPS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" loading={saving}>
                Save Profile
              </Button>
              {saveMessage && (
                <p className="text-sm text-neutral-600" role="status">
                  {saveMessage}
                </p>
              )}
            </div>
          </form>

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

      <section aria-labelledby="profile-account">
        <h2 id="profile-account" className="text-xl font-semibold text-neutral-800 mb-4">
          Danger Zone
        </h2>
        <div className="bg-white rounded-xl border border-error-200 p-6">
          <p className="text-sm text-neutral-600 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            Delete My Account
          </Button>
        </div>
      </section>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        id="delete-modal"
      >
        <p className="text-neutral-600 mb-6">
          This will permanently delete all your data including progress and quiz scores. This cannot
          be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            onClick={handleDeleteAccount}
            className="flex-1"
          >
            Yes, Delete Everything
          </Button>
        </div>
      </Modal>
    </div>
  )
}
