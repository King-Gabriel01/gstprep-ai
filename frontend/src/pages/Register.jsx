import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { uploadProfilePicture } from '../services/cloudinary';
import { userApi } from '../services/resources';

const LEVELS = [100, 200, 300, 400, 500, 600];
const STEPS = ['Account type', 'Your details', 'Profile picture'];

export default function Register() {
  const { register, googleAuth } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    role: 'student',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    gender: '',
    matricNumber: '',
    department: '',
    level: '',
    bio: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [pictureFile, setPictureFile] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validateStep1() {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      return 'First name, last name, email, and password are required.';
    }
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (!form.department) return 'Department is required.';
    if (form.role === 'student' && !form.matricNumber) return 'Matric number is required for students.';
    if (form.role === 'student' && !form.level) return 'Please select your level.';
    return '';
  }

  async function handleStep1Submit(e) {
    e.preventDefault();
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      setRegisteredUser(user);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePictureUpload() {
    if (!pictureFile) {
      navigate('/dashboard');
      return;
    }
    setUploadingPicture(true);
    setError('');
    try {
      const url = await uploadProfilePicture(pictureFile);
      await userApi.updateProfilePicture(url);
      navigate('/dashboard');
    } catch (err) {
      setError('Could not upload your picture. You can add one later from your profile.');
    } finally {
      setUploadingPicture(false);
    }
  }

  const handleGoogleCredential = useCallback(
    async (idToken) => {
      setError('');
      setLoading(true);
      try {
        await googleAuth({
          idToken,
          role: form.role,
          matricNumber: form.matricNumber,
          department: form.department,
          level: form.level,
          gender: form.gender,
        });
        navigate('/dashboard');
      } catch (err) {
        if (err.response?.data?.requiresProfileCompletion) {
          setError('Please fill in the required details below, then try Google sign-in again.');
          setStep(1);
        } else {
          setError(err.response?.data?.message || 'Google sign-in failed.');
        }
      } finally {
        setLoading(false);
      }
    },
    [googleAuth, form.role, form.matricNumber, form.department, form.level, form.gender, navigate]
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-md mx-auto px-6 pt-16 pb-16 animate-fade-slide-up">
        <h1 className="font-display text-3xl font-semibold text-paper">Create your account</h1>
        <p className="mt-2 text-muted text-sm">Set up your GSTPrep AI profile.</p>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i <= step ? 'bg-moss-500' : 'bg-ink-border'
                }`}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs font-mono text-muted uppercase tracking-wider">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>

        {step === 0 && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {['student', 'lecturer'].map((role) => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => update('role', role)}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-all duration-200 ease-smooth ${
                      form.role === role
                        ? 'border-moss-500 bg-moss-500/10 text-moss-400'
                        : 'border-ink-border text-muted hover:border-paper/25'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(1)} className="btn-primary btn-ripple w-full">
              Continue
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-ink-border" />
              <span className="text-xs text-muted font-mono">or</span>
              <div className="h-px flex-1 bg-ink-border" />
            </div>

            <GoogleSignInButton onCredential={handleGoogleCredential} />
            {loading && (
              <p className="text-xs text-muted text-center flex items-center justify-center gap-2">
                <Spinner /> Signing you in…
              </p>
            )}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="mt-8 space-y-5 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input
                  required
                  className="input-field"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Last name</label>
                <input
                  required
                  className="input-field"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Middle name (optional)</label>
              <input
                className="input-field"
                value={form.middleName}
                onChange={(e) => update('middleName', e.target.value)}
              />
            </div>

            <div>
              <label className="label">Email {form.role === 'lecturer' ? '(work or personal)' : ''}</label>
              <input
                type="email"
                required
                className="input-field"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.edu.ng"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input-field"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="label">Gender (optional)</label>
              <div className="grid grid-cols-2 gap-3">
                {['male', 'female'].map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => update('gender', form.gender === g ? '' : g)}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-all duration-200 ease-smooth ${
                      form.gender === g
                        ? 'border-moss-500 bg-moss-500/10 text-moss-400'
                        : 'border-ink-border text-muted hover:border-paper/25'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {form.role === 'student' && (
              <div className="animate-fade-in">
                <label className="label">Matric number</label>
                <input
                  required
                  className="input-field"
                  value={form.matricNumber}
                  onChange={(e) => update('matricNumber', e.target.value)}
                  placeholder="e.g. CSC/2021/045"
                />
              </div>
            )}

            <div>
              <label className="label">Department</label>
              <input
                required
                className="input-field"
                value={form.department}
                onChange={(e) => update('department', e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </div>

            {form.role === 'student' && (
              <div className="animate-fade-in">
                <label className="label">Level</label>
                <select
                  required
                  className="input-field"
                  value={form.level}
                  onChange={(e) => update('level', e.target.value)}
                >
                  <option value="" disabled>
                    Select your level
                  </option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l} level
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.role === 'lecturer' && (
              <div className="animate-fade-in">
                <label className="label">Short bio (optional)</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  placeholder="e.g. Senior Lecturer in the Department of Physics, PhD in Applied Mathematics."
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-clay bg-clay/10 border border-clay/20 rounded-lg px-3 py-2 animate-fade-in">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="btn-secondary btn-ripple flex-1"
              >
                Back
              </button>
              <button type="submit" disabled={loading} className="btn-primary btn-ripple flex-1">
                {loading ? (
                  <>
                    <Spinner /> Creating…
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="mt-8 space-y-6 animate-fade-in text-center">
            <p className="text-paper/70 text-sm">
              Welcome, {registeredUser?.firstName}! Add a profile picture so lecturers and students
              can recognise you. This step is optional.
            </p>

            <label className="block cursor-pointer">
              <div className="mx-auto w-28 h-28 rounded-full border-2 border-dashed border-ink-border flex items-center justify-center overflow-hidden hover:border-moss-500/50 transition-colors duration-200">
                {pictureFile ? (
                  <img
                    src={URL.createObjectURL(pictureFile)}
                    alt="Selected profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    className="w-8 h-8 text-muted"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                  </svg>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={(e) => setPictureFile(e.target.files[0])}
              />
              <p className="mt-3 text-xs text-moss-400 font-medium">
                {pictureFile ? 'Change photo' : 'Choose a JPEG or PNG'}
              </p>
            </label>

            {error && <p className="text-sm text-clay animate-fade-in">{error}</p>}

            <button
              onClick={handlePictureUpload}
              disabled={uploadingPicture}
              className="btn-primary btn-ripple w-full"
            >
              {uploadingPicture ? (
                <>
                  <Spinner /> Uploading…
                </>
              ) : pictureFile ? (
                'Save and continue'
              ) : (
                'Skip for now'
              )}
            </button>
          </div>
        )}

        {step === 0 && (
          <p className="mt-6 text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="link-underline font-medium">
              Log in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
