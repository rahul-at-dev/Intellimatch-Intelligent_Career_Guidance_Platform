"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Briefcase,
  Check,
  Edit3,
  FileText,
  GraduationCap,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Target,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Profile } from "@/types/api";
import { Card, LoadingBlock, PageHeader, Pill } from "@/components/ui";

export default function ProfilePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    full_name: "",
    current_role: "Backend Engineer",
    target_role: "Senior Backend Engineer",
    location: "Bangalore, India",
    years_experience: 3.5,
  });

  // New skill input state
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(3.0);
  const [showAddSkill, setShowAddSkill] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const p = await api.profile();
        // If Clerk user is available, prioritize Clerk user's full name & email
        const clerkFullName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
        const effectiveName = clerkFullName || p.full_name || "Rahul I";
        
        const mergedProfile = {
          ...p,
          full_name: effectiveName,
        };
        
        setProfile(mergedProfile);
        setFormData({
          full_name: effectiveName,
          current_role: p.current_role || "Backend Engineer",
          target_role: p.target_role || "Senior Backend Engineer",
          location: p.location || "Bangalore, India",
          years_experience: p.years_experience || 3.5,
        });

        // If backend profile name differs from Clerk, sync it quietly
        if (clerkFullName && p.full_name !== clerkFullName) {
          api.profileUpdate({ full_name: clerkFullName }).catch(() => {});
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        // Fallback default
        const fallbackName = user?.fullName || "Rahul I";
        setProfile({
          id: user?.id || "candidate-1",
          full_name: fallbackName,
          current_role: "Backend Engineer",
          target_role: "Senior Backend Engineer",
          years_experience: 3.5,
          location: "Bangalore, India",
          skills: {
            Python: 3.8,
            FastAPI: 3.0,
            PostgreSQL: 3.2,
            Docker: 2.0,
            "REST APIs": 3.5,
            Git: 4.0,
            "System Design": 2.2,
            Testing: 2.8,
          },
          resume_text: null,
          profile_strength: 85,
        });
        setFormData({
          full_name: fallbackName,
          current_role: "Backend Engineer",
          target_role: "Senior Backend Engineer",
          location: "Bangalore, India",
          years_experience: 3.5,
        });
      } finally {
        setLoading(false);
      }
    }

    if (isUserLoaded) {
      loadProfile();
    }
  }, [isUserLoaded, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await api.profileUpdate({
        full_name: formData.full_name,
        current_role: formData.current_role,
        target_role: formData.target_role,
        location: formData.location,
        years_experience: Number(formData.years_experience),
      });
      setProfile((prev) => prev ? { ...prev, ...updated, full_name: formData.full_name } : updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile", err);
      // Optimistic local update
      setProfile((prev) => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSkillLevelChange = async (skill: string, newLevel: number) => {
    if (!profile) return;
    const updatedSkills = { ...profile.skills, [skill]: Math.max(0.5, Math.min(5.0, newLevel)) };
    setProfile({ ...profile, skills: updatedSkills });
    try {
      await api.profileUpdate({ skills: updatedSkills });
    } catch (err) {
      console.error("Failed to update skill", err);
    }
  };

  const handleDeleteSkill = async (skill: string) => {
    if (!profile) return;
    const updatedSkills = { ...profile.skills };
    delete updatedSkills[skill];
    setProfile({ ...profile, skills: updatedSkills });
    try {
      await api.profileUpdate({ skills: updatedSkills });
    } catch (err) {
      console.error("Failed to delete skill", err);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newSkillName.trim()) return;
    const skillName = newSkillName.trim();
    const updatedSkills = { ...profile.skills, [skillName]: newSkillLevel };
    setProfile({ ...profile, skills: updatedSkills });
    setNewSkillName("");
    setNewSkillLevel(3.0);
    setShowAddSkill(false);
    try {
      await api.profileUpdate({ skills: updatedSkills });
    } catch (err) {
      console.error("Failed to add skill", err);
    }
  };

  if (loading || !profile) return <LoadingBlock label="Loading candidate profile..." />;

  const displayName = profile.full_name || user?.fullName || "Rahul I";
  const displayEmail = user?.primaryEmailAddress?.emailAddress || "rahul.persnl04@gmail.com";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "RI";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Candidate Profile"
          subtitle="Your verified skills, role preferences, and career data used across IntelliMatch AI engines."
        />
        <div className="flex items-center gap-3">
          <Link
            href="/resume-analysis"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <FileText size={15} className="text-brand-600" />
            Sync from Resume
          </Link>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-3.5"
          >
            <Edit3 size={15} />
            {isEditing ? "Close Editor" : "Edit Profile"}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 animate-fadeIn">
          <Check size={16} className="text-emerald-600" />
          Profile changes saved successfully!
        </div>
      )}

      {/* Edit Form Drawer / Card */}
      {isEditing && (
        <Card className="border-brand-200 bg-brand-50/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Edit Profile Information</h3>
            </div>
            <span className="text-xs text-slate-500">Synced across matching and career engines</span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none"
                  placeholder="e.g. Rahul I"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none"
                  placeholder="e.g. Bangalore, India"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Current Role</label>
                <input
                  type="text"
                  value={formData.current_role}
                  onChange={(e) => setFormData({ ...formData, current_role: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none"
                  placeholder="e.g. Backend Engineer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Target Role</label>
                <input
                  type="text"
                  value={formData.target_role}
                  onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none"
                  placeholder="e.g. Senior Backend Engineer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Years of Experience</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="30"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-5"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Candidate Summary Card */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="p-6 text-center">
            {/* Avatar */}
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-brand-500/20 ring-4 ring-brand-50">
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Name & Title */}
            <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{displayEmail}</p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 font-medium">
                <Briefcase size={13} className="text-slate-400" />
                {profile.current_role}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 font-medium">
                <MapPin size={13} className="text-slate-400" />
                {profile.location}
              </span>
            </div>

            <div className="mt-4 flex justify-center">
              <Pill tone="brand">Target: {profile.target_role}</Pill>
            </div>

            <hr className="my-5 border-slate-100" />

            {/* Profile Strength */}
            <div className="text-left">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">Profile Readiness</span>
                <span className="text-brand-600 font-bold">{profile.profile_strength || 85}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 transition-all duration-500"
                  style={{ width: `${profile.profile_strength || 85}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Calculated from skill coverage and experience depth.
              </p>
            </div>

            <hr className="my-5 border-slate-100" />

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Experience</p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">{profile.years_experience} Yrs</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Verified Skills</p>
                <p className="mt-0.5 text-sm font-bold text-brand-600">{Object.keys(profile.skills).length} Active</p>
              </div>
            </div>
          </Card>

          {/* Quick Nav Card */}
          <Card className="p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Career Actions</h4>
            <div className="mt-3 space-y-2">
              <Link
                href="/matching"
                className="flex items-center justify-between rounded-lg p-2.5 text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Target size={15} className="text-brand-600" />
                  View Matching Jobs
                </span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link
                href="/career-simulator"
                className="flex items-center justify-between rounded-lg p-2.5 text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={15} className="text-indigo-600" />
                  Simulate Career Path
                </span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link
                href="/resume-analysis"
                className="flex items-center justify-between rounded-lg p-2.5 text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Zap size={15} className="text-amber-500" />
                  Run ATS Resume Check
                </span>
                <span className="text-slate-400">→</span>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Skills & Proficiencies Grid */}
        <div className="space-y-6 lg:col-span-8">
          <Card className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Skills & Proficiency Matrix</h3>
                <p className="text-xs text-slate-500">
                  Used by LightGBM matching model and knowledge graph to recommend roles.
                </p>
              </div>
              <button
                onClick={() => setShowAddSkill(!showAddSkill)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
              >
                <Plus size={14} />
                {showAddSkill ? "Close" : "Add Skill"}
              </button>
            </div>

            {/* Add Skill Form */}
            {showAddSkill && (
              <form onSubmit={handleAddSkill} className="mb-6 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <h4 className="text-xs font-bold text-slate-900 mb-3">Add Competency or Technical Skill</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-7">
                    <input
                      type="text"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="e.g. Next.js, Kubernetes, AWS, TypeScript"
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-3">
                    <span className="text-xs text-slate-600 whitespace-nowrap">Level:</span>
                    <select
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(parseFloat(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                    >
                      <option value={1.0}>1.0 (Beginner)</option>
                      <option value={2.0}>2.0 (Basic)</option>
                      <option value={3.0}>3.0 (Intermediate)</option>
                      <option value={4.0}>4.0 (Advanced)</option>
                      <option value={5.0}>5.0 (Expert)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="btn-primary w-full text-xs py-2"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Skills List */}
            <div className="space-y-4">
              {Object.entries(profile.skills).length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No skills added yet. Click &quot;Add Skill&quot; or upload your resume to extract skills automatically.
                </p>
              ) : (
                Object.entries(profile.skills).map(([skill, level]) => (
                  <div
                    key={skill}
                    className="group rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-colors hover:border-slate-200 hover:bg-white"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{skill}</span>
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {level >= 4 ? "Advanced" : level >= 3 ? "Proficient" : "Foundational"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-brand-700">{level.toFixed(1)} / 5.0</span>
                        <button
                          onClick={() => handleDeleteSkill(skill)}
                          title="Delete skill"
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.1"
                        value={level}
                        onChange={(e) => handleSkillLevelChange(skill, parseFloat(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-brand-600"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
