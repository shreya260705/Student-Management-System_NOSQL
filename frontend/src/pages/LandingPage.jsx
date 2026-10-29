import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  Award,
  BarChart3,
  Calendar,
  Bell,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  BookOpen,
  Send,
  Building,
  Check,
  TrendingUp,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import { apiService } from '../services/api';

export default function LandingPage({ onOpenAuth, onExploreDemo }) {
  const [stats, setStats] = useState({
    total_students: 16,
    total_teachers: 4,
    total_courses: 6,
    total_classes: 12,
    average_attendance: 88.5,
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [contactStatus, setContactStatus] = useState({
    loading: false,
    success: '',
    error: '',
  });

  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await apiService.getPublicStats();
        if (data) {
          setStats((prev) => ({
            ...prev,
            total_students: data.total_students ?? prev.total_students,
            total_teachers: data.total_teachers ?? prev.total_teachers,
            total_courses: data.total_courses ?? prev.total_courses,
            total_classes: data.total_classes ?? prev.total_classes,
            average_attendance:
              data.average_attendance ?? prev.average_attendance,
          }));
        }
      } catch (err) {
        // Fallback to initial state gracefully
      }
    }
    fetchStats();
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus({ loading: true, success: '', error: '' });
    try {
      const res = await apiService.submitContact(contactForm);
      setContactStatus({
        loading: false,
        success: res.message || 'Message sent successfully!',
        error: '',
      });
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setContactStatus({
        loading: false,
        success: '',
        error: err.message || 'Failed to submit inquiry. Please try again.',
      });
    }
  };

  const faqs = [
    {
      q: 'Why does EduManage use MongoDB NoSQL instead of a traditional SQL relational database?',
      a: 'EduManage utilizes MongoDB (NoSQL) with PyMongo to store flexible, unified student documents that seamlessly contain nested subject marks, semester standings, and personal history. This eliminates costly multi-table joins while enabling lightning-fast academic aggregations without rigid ALTER TABLE migrations.',
    },
    {
      q: 'How does native MongoDB Schema Validation protect student academic data?',
      a: 'Validation is enforced directly at the MongoDB engine layer via $jsonSchema. The database guarantees that semesters remain between 1 and 8, marks stay within 0 to 100, and roll numbers and emails maintain unique index constraints.',
    },
    {
      q: 'How are grades and academic GPA computed?',
      a: 'Grading follows institutional boundaries: Grade A (>=80%), Grade B (70-79%), Grade C (60-69%), Grade D (40-59%), and Grade F (<40%). GPA is computed on a standard 10.0 scale, and attendance is factored into academic eligibility.',
    },
    {
      q: 'What role-based access protections are implemented?',
      a: 'EduManage enforces strict role-based access control (RBAC). Administrators have full institutional governance; faculty can only record attendance and marks for their assigned classes; and students can securely view only their own records, attendance, and official report cards.',
    },
    {
      q: 'Can student lists and examination results be exported?',
      a: 'Yes. Administrators and faculty can export complete student directories to CSV, import batches via validated CSV uploads, and generate official printable student report cards.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Top Navbar */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                EduManage
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  NoSQL v2.0
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium">
                Intelligent Academic Administration
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#hero" className="hover:text-white transition">
              Home
            </a>
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#workflows" className="hover:text-white transition">
              Workflows
            </a>
            <a href="#stats" className="hover:text-white transition">
              Metrics
            </a>
            <a href="#about" className="hover:text-white transition">
              About
            </a>
            <a href="#contact" className="hover:text-white transition">
              Contact
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white transition"
            >
              Sign In
            </button>
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 hover:shadow-indigo-500/50 transition flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section id="hero" className="relative pt-16 pb-24 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[250px] bg-violet-600/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Generation Academic Administration & NoSQL Analytics</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
            One Platform. Every Student.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-violet-400">
              Better Outcomes.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Unify student records, attendance tracking, examination results,
            and real-time academic analytics. Powered by high-throughput MongoDB
            document storage and pure PyMongo aggregation pipelines.
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenAuth}
              className="px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 transition flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onExploreDemo}
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Explore Live Platform</span>
            </button>
            <a
              href="#features"
              className="px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white transition"
            >
              Explore Features ↓
            </a>
          </div>

          {/* Quick Highlight Pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pure PyMongo Driver (No ORM Bloat)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Engine-Level $jsonSchema Validation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Role-Based Portals (Admin, Teacher, Student)</span>
            </div>
          </div>
        </div>

        {/* 3. Realistic Application UI Preview Composition */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 relative z-10">
          <div className="rounded-2xl bg-slate-950 p-2 sm:p-3 shadow-2xl border border-slate-800 shadow-indigo-950/50">
            {/* Window bar */}
            <div className="h-9 px-4 bg-slate-900 rounded-t-xl flex items-center justify-between border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 font-mono text-[11px] text-slate-400 hidden sm:inline">
                  edumanage.institution.edu/portal/dashboard
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-slate-300">
                  MongoDB Connected
                </span>
              </div>
            </div>

            {/* Mock Dashboard Body */}
            <div className="bg-slate-900/90 rounded-b-xl p-5 sm:p-6 text-left">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Academic Overview
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Live Database
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time metrics from current MongoDB session
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onExploreDemo}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <span>Launch Dashboard</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* KPI Cards Preview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Total Students</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {stats.total_students}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Verified Documents</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Faculty Members</span>
                    <GraduationCap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {stats.total_teachers}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Active Teaching Staff
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Academic Courses</span>
                    <BookOpen className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {stats.total_courses}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    CSE, IT, AI&DS, ECE...
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Avg Attendance</span>
                    <CalendarCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {stats.average_attendance}%
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1">
                    Satisfactory Status
                  </div>
                </div>
              </div>

              {/* Sample Students Snippet Table */}
              <div className="mt-5 bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
                  <span>Recent Enrollees & Standings</span>
                  <span className="text-[11px] text-slate-400">
                    Auto-calculated Averages & Grades
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/90 text-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                        AS
                      </div>
                      <div>
                        <span className="font-semibold text-white">
                          Aarav Sharma
                        </span>
                        <span className="text-slate-400 ml-2">CSE2024001</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>CSE • Sem 6</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        94.0%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Grade A
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/90 text-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                        PP
                      </div>
                      <div>
                        <span className="font-semibold text-white">
                          Priya Patel
                        </span>
                        <span className="text-slate-400 ml-2">IT2024002</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>IT • Sem 4</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        87.3%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Grade A
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Feature Cards Section */}
      <section id="features" className="py-20 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Enterprise Academic Modules
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              Built Specifically for Modern College Administration
            </p>
            <p className="mt-3 text-slate-400 text-sm">
              Every workflow—from enrollment to grading and attendance—is
              integrated into an intuitive, responsive interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Student Records */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/50 transition group hover:shadow-xl hover:shadow-indigo-950/30">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Unified Student Records
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Single source of truth containing student profiles, contact
                details, course standings, and semester history. Includes fast
                search, multi-criteria filtering, and CSV batch import/export.
              </p>
            </div>

            {/* Card 2: Attendance Management */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition group hover:shadow-xl hover:shadow-emerald-950/30">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Attendance Management
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Record and update session attendance by date, class, and
                subject. Automatic calculation of attendance percentage with
                intelligent alerts for students below the 75% shortage threshold.
              </p>
            </div>

            {/* Card 3: Examinations & Report Cards */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 hover:border-amber-500/50 transition group hover:shadow-xl hover:shadow-amber-950/30">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Exams & Official Report Cards
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manage exam terms, batch mark entries with 0-100 range
                validation, calculate letter grades and GPA, and produce
                official printable academic report cards.
              </p>
            </div>

            {/* Card 4: 5 Native PyMongo Aggregation Pipelines */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 hover:border-violet-500/50 transition group hover:shadow-xl hover:shadow-violet-950/30">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 group-hover:scale-110 transition">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                5 NoSQL Aggregations
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deep academic analytics executed entirely inside MongoDB.
                Includes department distributions, academic averages, top rankers,
                grade distributions, and semester enrollees.
              </p>
            </div>

            {/* Card 5: Class Timetables */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 hover:border-blue-500/50 transition group hover:shadow-xl hover:shadow-blue-950/30">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Class Timetables & Scheduling
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organize weekly class schedules, subjects, assigned faculty,
                and lecture hall rooms. Real-time timetable access for students
                and teachers.
              </p>
            </div>

            {/* Card 6: Bulletins & Notices */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 hover:border-rose-500/50 transition group hover:shadow-xl hover:shadow-rose-950/30">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 transition">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Announcements & Notice Board
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Broadcast institutional news, exam circulars, and departmental
                updates targeted specifically to All, Teachers, or Students with
                pinning priority.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Real Database Metrics Section */}
      <section id="stats" className="py-20 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Verified Database Statistics
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              Live Counts from Active MongoDB Store
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Derived directly from active PyMongo collections and document counts.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-4xl sm:text-5xl font-black text-indigo-400 font-mono">
                {stats.total_students}
              </div>
              <div className="text-sm font-semibold text-white mt-2">
                Active Student Documents
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Schema validated via $jsonSchema
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono">
                {stats.total_teachers}
              </div>
              <div className="text-sm font-semibold text-white mt-2">
                Registered Faculty
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Assigned subjects & classes
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-4xl sm:text-5xl font-black text-violet-400 font-mono">
                {stats.total_courses}
              </div>
              <div className="text-sm font-semibold text-white mt-2">
                Academic Departments
              </div>
              <div className="text-xs text-slate-400 mt-1">
                CSE, IT, AI&DS, ECE, MECH, CIVIL
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono">
                {stats.average_attendance}%
              </div>
              <div className="text-sm font-semibold text-white mt-2">
                Overall Attendance Rate
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Calculated across all sessions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Role-Based Workflows Section */}
      <section id="workflows" className="py-20 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Role-Specific Workflows
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              Tailored Experiences for Every Stakeholder
            </h2>
            <p className="mt-2 text-slate-400 text-sm">
              Role-based authorization prevents privilege escalation and ensures
              seamless, focused daily operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Workflow 1: Admin */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Administrator</h3>
              <p className="text-xs text-indigo-300 font-medium mb-4">
                Total Institutional Governance
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Manage complete student and faculty directories</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Configure courses, classes, sections, and subjects</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Inspect institutional aggregations and performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Publish exam results, manage fees, and broadcast news</span>
                </li>
              </ul>
            </div>

            {/* Workflow 2: Teacher */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Teaching Faculty</h3>
              <p className="text-xs text-emerald-300 font-medium mb-4">
                Classroom & Academic Execution
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>View only assigned classes and enrolled rosters</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Record daily attendance (Present, Absent, Late, Excused)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Enter and update subject marks with real-time validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Inspect class performance charts and post notices</span>
                </li>
              </ul>
            </div>

            {/* Workflow 3: Student */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Student</h3>
              <p className="text-xs text-blue-300 font-medium mb-4">
                Academic Transparency & Growth
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>View personal profile, roll number, and department</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Inspect subject marks, letter grade, and 10-scale GPA</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Track attendance percentage with low attendance warnings</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>View and print official academic report cards</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. About & Contact Form Section */}
      <section id="about" className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* About EduManage */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                About the Platform
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                Engineered for Academic Excellence & NoSQL Demonstration
              </h2>
              <div className="mt-4 space-y-4 text-sm text-slate-300 leading-relaxed">
                <p>
                  <strong>EduManage</strong> was engineered to demonstrate the
                  superior capabilities of NoSQL document-oriented databases
                  for educational management systems.
                </p>
                <p>
                  Traditional SQL schemas require complex tables joined via
                  multiple foreign keys to compute student GPA, attendance
                  eligibility, and department distributions. In EduManage, MongoDB
                  handles all data manipulation inside optimized Aggregation
                  Pipelines, producing instant, memory-efficient results.
                </p>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span>Technical Architecture Highlights</span>
                  </div>
                  <ul className="space-y-1 text-slate-400">
                    <li>• <strong>NoSQL Database</strong>: MongoDB 7.0+ with PyMongo driver</li>
                    <li>• <strong>Backend</strong>: Python 3.11 / 3.14 + Flask REST API with CORS</li>
                    <li>• <strong>Frontend</strong>: React 19 + Vite 6 + Tailwind CSS</li>
                    <li>• <strong>Data Visualizations</strong>: Recharts SVG rendering</li>
                    <li>• <strong>Security</strong>: PBKDF2 Password Hashing & URLSafe Timed Tokens</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div id="contact" className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-1">
                Contact Academic Administration
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Have questions or need assistance? Inquiries are routed directly to administration (<span className="text-indigo-400 font-medium">shreyatpathi2005@gmail.com</span>).
              </p>

              {contactStatus.success && (
                <div className="mb-4 p-3.5 bg-emerald-950/60 border border-emerald-700/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{contactStatus.success}</span>
                </div>
              )}
              {contactStatus.error && (
                <div className="mb-4 p-3.5 bg-rose-950/60 border border-rose-700/50 rounded-xl text-rose-300 text-xs">
                  {contactStatus.error}
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Smith"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@university.edu"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Admission Inquiry / System Feedback"
                    value={contactForm.subject}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, subject: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Type your message here..."
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, message: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactStatus.loading}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {contactStatus.loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Got Questions?
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Everything you need to know about the architecture and viva defense topics.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-indigo-300 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Professional Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span>EduManage</span>
              </div>
              <p className="text-slate-400 text-xs">
                Comprehensive Student Management System designed for Intelligent
                NoSQL Databases (CSE494).
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Status: All Systems Operational</span>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Academic Modules</h4>
              <ul className="space-y-1.5 text-xs">
                <li>Student Directory</li>
                <li>Faculty Roster</li>
                <li>Courses & Classes</li>
                <li>Attendance Tracker</li>
                <li>Examinations & Results</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Technology Stack</h4>
              <ul className="space-y-1.5 text-xs">
                <li>MongoDB 7.0 (NoSQL)</li>
                <li>PyMongo Driver 4.8</li>
                <li>Python Flask 3.0</li>
                <li>React 19 + Vite 6</li>
                <li>Tailwind CSS + Recharts</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Project Metadata</h4>
              <p className="text-xs text-slate-300">
                Lovely Professional University
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Course: CSE494 (NoSQL Databases)
              </p>
              <button
                onClick={onOpenAuth}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition"
              >
                Access Portal
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>
              © {new Date().getFullYear()} EduManage — Intelligent NoSQL Student Management System. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span>Pure PyMongo</span>
              <span>•</span>
              <span>$jsonSchema Validated</span>
              <span>•</span>
              <span>RESTful Architecture</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
