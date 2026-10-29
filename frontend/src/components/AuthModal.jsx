import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  GraduationCap,
  Briefcase,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { apiService, setStoredToken, setStoredUser } from '../services/api';

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleInputEmail, setGoogleInputEmail] = useState('');
  const [googleInputName, setGoogleInputName] = useState('');
  const [googleInputRole, setGoogleInputRole] = useState('student');
  const [googleInputDept, setGoogleInputDept] = useState('CSE');
  const [googleInputSem, setGoogleInputSem] = useState(4);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'student', // 'student' | 'teacher'
    associated_id: '',
    department: 'CSE',
    semester: 4,
    reset_code: '',
    new_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeResetCode, setActiveResetCode] = useState('');

  // Clear all form inputs on modal open or mode switch
  React.useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        name: '',
        email: '',
        password: '',
        confirm_password: '',
        reset_code: '',
        new_password: '',
      }));
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, mode]);

  const authCallbackRef = React.useRef();

  const ensureGsiInitialized = React.useCallback((clientId) => {
    if (window.google?.accounts?.id && !window.__gsi_initialized__) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            authCallbackRef.current?.(response.credential);
          }
        },
      });
      window.__gsi_initialized__ = true;
    }
  }, []);

  // Initialize official Google Identity Services button
  React.useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && window.google?.accounts?.id && (mode === 'login' || mode === 'register')) {
      try {
        ensureGsiInitialized(clientId);
        const container = document.getElementById('gsi-official-button');
        if (container) {
          container.innerHTML = '';
          window.google.accounts.id.renderButton(container, {
            type: 'standard',
            shape: 'rectangular',
            theme: 'outline',
            text: mode === 'login' ? 'signin_with' : 'signup_with',
            size: 'large',
            logo_alignment: 'left',
            width: 360,
          });
        }
      } catch (err) {
        console.warn('GSI render error:', err);
      }
    }
  }, [mode, isOpen, ensureGsiInitialized]);

  if (!isOpen) return null;

  const resetFormState = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Google OAuth Handler
  const executeGoogleAuth = async (email, name, role, credential, deptOverride, semOverride) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const chosenDept = deptOverride || googleInputDept || formData.department || 'CSE';
      const chosenSem = Number(semOverride || googleInputSem || formData.semester) || 1;
      const payload = {
        role: role || googleInputRole || formData.role || 'student',
        department: chosenDept,
        course: chosenDept,
        semester: chosenSem,
      };
      if (credential) {
        payload.credential = credential;
      } else {
        const targetEmail = (email || googleInputEmail || formData.email || 'user.student@gmail.com').trim().toLowerCase();
        const targetName = (name || googleInputName || (targetEmail.split('@')[0].replace('.', ' ').toUpperCase())).trim();
        payload.email = targetEmail;
        payload.name = targetName;
        payload.google_id = `goog_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        payload.picture = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(targetName)}`;
      }

      const res = await apiService.googleAuth(payload);

      setStoredToken(res.token);
      setStoredUser(res.user);
      onAuthSuccess(res.user);
      setGoogleModalOpen(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  authCallbackRef.current = (credential) => {
    executeGoogleAuth(null, null, formData.role, credential);
  };

  const openGooglePrompt = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && window.google?.accounts?.id) {
      try {
        ensureGsiInitialized(clientId);
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('GSI prompt fallback:', err);
      }
    }
    setGoogleInputEmail(formData.email || '');
    setGoogleInputName(formData.name || '');
    setGoogleInputRole(formData.role || 'student');
    setGoogleModalOpen(true);
  };

  // Email / Password Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        const res = await apiService.login(formData.email, formData.password);
        setStoredToken(res.token);
        setStoredUser(res.user);
        onAuthSuccess(res.user);
        onClose();
      } else if (mode === 'register') {
        const res = await apiService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          associated_id: formData.associated_id,
          department: formData.department,
          course: formData.department,
          semester: Number(formData.semester) || 1,
        });
        setStoredToken(res.token);
        setStoredUser(res.user);
        onAuthSuccess(res.user);
        onClose();
      } else if (mode === 'forgot') {
        const res = await apiService.forgotPassword(formData.email);
        setSuccessMsg(res.message);
        if (res.demo_reset_code) {
          setActiveResetCode(res.demo_reset_code);
          setFormData((prev) => ({ ...prev, reset_code: res.demo_reset_code }));
        }
        setMode('reset');
      } else if (mode === 'reset') {
        if (!formData.reset_code) {
          throw new Error('Please enter the 6-digit verification code.');
        }
        if (!formData.new_password || formData.new_password.length < 6) {
          throw new Error('New password must be at least 6 characters.');
        }
        if (formData.confirm_password && formData.new_password !== formData.confirm_password) {
          throw new Error('New password and confirmation password do not match.');
        }

        const res = await apiService.resetPassword({
          email: formData.email,
          reset_code: formData.reset_code,
          new_password: formData.new_password,
        });

        setSuccessMsg(res.message);
        setTimeout(() => {
          resetFormState('login');
          setFormData((prev) => ({ ...prev, password: '' }));
        }, 1800);
      }
    } catch (err) {
      setError(err.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiService.forgotPassword(formData.email);
      setSuccessMsg(`New verification code sent to ${formData.email}!`);
      if (res.demo_reset_code) {
        setActiveResetCode(res.demo_reset_code);
        setFormData((prev) => ({ ...prev, reset_code: res.demo_reset_code }));
      }
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-7 h-7 text-indigo-300" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">EduManage Platform</h2>
          <p className="text-xs text-indigo-200 mt-1">
            {mode === 'login' && 'Sign in to access your role-based academic portal'}
            {mode === 'register' && 'Register a new Student or Teacher account'}
            {mode === 'forgot' && 'Reset your academic account password via email'}
            {mode === 'reset' && 'Enter your 6-digit code & create a new password'}
          </p>

          {/* Mode Switcher Tabs */}
          {(mode === 'login' || mode === 'register') && (
            <div className="flex bg-white/10 p-1 rounded-xl mt-4 border border-white/10">
              <button
                type="button"
                onClick={() => resetFormState('login')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-indigo-100 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => resetFormState('register')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-indigo-100 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google One-Click Auth Button (Login & Register Modes) */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mb-4">
              {/* Official Google Identity Services Render Container */}
              <div id="gsi-official-button" className="w-full flex justify-center mb-2.5 overflow-hidden rounded-xl" />

              <button
                type="button"
                onClick={openGooglePrompt}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-xs hover:border-slate-400 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <GoogleIcon />
                <span>
                  {mode === 'login' ? 'Continue with Google (One-Tap / Instant)' : 'Register with Google (One-Tap / Instant)'}
                </span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">
                    Or continue with email
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5">
            {/* Hidden dummy inputs to prevent browser autofill of old credentials saved for localhost */}
            <input
              type="text"
              name="prevent_autofill_user"
              tabIndex={-1}
              style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, height: 0, width: 0 }}
              aria-hidden="true"
              autoComplete="off"
            />
            <input
              type="password"
              name="prevent_autofill_pwd"
              tabIndex={-1}
              style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, height: 0, width: 0 }}
              aria-hidden="true"
              autoComplete="new-password"
            />
            {/* Registration specific fields */}
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Course / Department
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="CSE">Computer Science (CSE)</option>
                      <option value="IT">Information Technology (IT)</option>
                      <option value="AI&DS">AI & Data Science (AI&DS)</option>
                      <option value="ECE">Electronics & Communication (ECE)</option>
                      <option value="MECH">Mechanical Engineering (MECH)</option>
                      <option value="CIVIL">Civil Engineering (CIVIL)</option>
                    </select>
                  </div>
                </div>

                {formData.role === 'student' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Roll No (Optional)
                      </label>
                      <input
                        type="text"
                        name="associated_id"
                        placeholder="Auto-generated if empty"
                        value={formData.associated_id}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Semester
                      </label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Email Field (Login, Register, and Forgot modes) */}
            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="name@institution.edu"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Password Field (Login & Register) */}
            {(mode === 'login' || mode === 'register') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => resetFormState('forgot')}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Reset Mode: OTP Verification Code & New Password */}
            {mode === 'reset' && (
              <>
                {/* Active Reset Code info banner */}
                {activeResetCode && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                        Generated Verification Code
                      </div>
                      <div className="text-sm font-bold font-mono text-amber-950 tracking-widest mt-0.5">
                        {activeResetCode}
                      </div>
                    </div>
                    <span className="text-[10px] bg-amber-200/70 text-amber-900 font-medium px-2 py-0.5 rounded-full">
                      Valid 15m
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      6-Digit Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={loading}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Resend Code
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="reset_code"
                      required
                      maxLength={10}
                      placeholder="e.g. 123456"
                      value={formData.reset_code}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="new_password"
                      required
                      placeholder="At least 6 characters"
                      value={formData.new_password}
                      onChange={handleChange}
                      className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      required
                      placeholder="Re-enter new password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In to Portal'}
                    {mode === 'register' && 'Create Account'}
                    {mode === 'forgot' && 'Send 6-Digit Verification Code'}
                    {mode === 'reset' && 'Reset Password & Proceed'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom helper */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            {mode === 'forgot' || mode === 'reset' ? (
              <button
                type="button"
                onClick={() => resetFormState('login')}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Back to Sign In
              </button>
            ) : mode === 'login' ? (
              <p className="text-xs text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => resetFormState('register')}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => resetFormState('login')}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Sign In instead
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Google Sign-In Quick Selection Prompt Modal */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-scale-up">
            <button
              onClick={() => setGoogleModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <GoogleIcon />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sign in with Google</h3>
                <p className="text-[11px] text-slate-500">Direct OAuth registration & login</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Google Account Email
                </label>
                <input
                  type="email"
                  value={googleInputEmail}
                  onChange={(e) => setGoogleInputEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={googleInputName}
                  onChange={(e) => setGoogleInputName(e.target.value)}
                  placeholder="e.g. Shreya Tripathi"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Role (If new user)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGoogleInputRole('student')}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition ${
                      googleInputRole === 'student'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleInputRole('teacher')}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition ${
                      googleInputRole === 'teacher'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Teacher
                  </button>
                </div>
              </div>

              {googleInputRole === 'student' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                      Course / Program
                    </label>
                    <select
                      value={googleInputDept}
                      onChange={(e) => setGoogleInputDept(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="CSE">CSE (Computer Science)</option>
                      <option value="IT">IT (Information Tech)</option>
                      <option value="AI&DS">AI&DS (AI & Data)</option>
                      <option value="ECE">ECE (Electronics)</option>
                      <option value="MECH">MECH (Mechanical)</option>
                      <option value="CIVIL">CIVIL (Civil)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                      Semester
                    </label>
                    <select
                      value={googleInputSem}
                      onChange={(e) => setGoogleInputSem(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => executeGoogleAuth(googleInputEmail, googleInputName, googleInputRole, null, googleInputDept, googleInputSem)}
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Authorize & Continue</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <span className="text-[10px] text-slate-400">
                  Secured with MongoDB JWT Session & PyMongo NoSQL
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}