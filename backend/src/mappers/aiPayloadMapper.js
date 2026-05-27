/**
 * aiPayloadMapper.js
 *
 * Single module that owns every transformation FROM backend models TO AI payloads.
 * Keep all field renames and normalizations here — never spread them across controllers.
 */

// ─── Education level enums ────────────────────────────────────────────────────

// Backend uses lowercase literals; AI uses the same set but 'any' becomes null
const BACKEND_TO_AI_EDUCATION = {
  any: null,
  olevel: 'olevel',
  bachelor: 'bachelor',
  master: 'master',
  phd: 'phd',
};

// AI parse response may return capitalized values from legacy runs; normalize them
const AI_TO_BACKEND_EDUCATION = {
  olevel: 'olevel',
  bachelor: 'bachelor',
  Bachelor: 'bachelor',
  master: 'master',
  Master: 'master',
  phd: 'phd',
  PhD: 'phd',
  null: null,
};

function backendEducationToAi(level) {
  if (level == null) return null;
  return BACKEND_TO_AI_EDUCATION[level] ?? null;
}

function aiEducationToBackend(level) {
  if (level == null) return null;
  return AI_TO_BACKEND_EDUCATION[level] ?? null;
}

// ─── Skill helpers ────────────────────────────────────────────────────────────

function normalizeSkills(skills = []) {
  return [...new Set(skills.map((s) => s.toLowerCase().trim()).filter(Boolean))];
}

// ─── JobRequirement → AI JobInput ─────────────────────────────────────────────

/**
 * @param {import('../models/JobRequirement')} job  Mongoose document
 * @returns {object} AI-shaped job payload
 */
function jobToAiInput(job) {
  return {
    job_id: job._id.toString(),
    title: job.jobTitle,
    description: job.description,
    required_skills: normalizeSkills(job.requiredSkills),
    preferred_skills: normalizeSkills(job.preferredSkills),
    required_experience_years: job.experienceYears ?? 0,
    required_education_level: backendEducationToAi(job.educationLevel),
  };
}

// ─── CandidateProfile + Resume → AI CandidateInput ───────────────────────────

/**
 * @param {import('../models/CandidateProfile')} profile  Mongoose document
 * @param {import('../models/Resume')} resume              Mongoose document
 * @returns {object} AI-shaped candidate payload
 */
function candidateToAiInput(profile, resume) {
  const merged = normalizeSkills([
    ...(profile.skills || []),
    ...(profile.manuallyAddedSkills || []),
  ]);

  return {
    candidate_id: profile._id.toString(),
    full_name: profile.personalInfo?.fullName ?? null,
    email: profile.personalInfo?.email ?? null,
    skills: merged,
    years_experience: profile.yearsExperience ?? 0,
    education_level: backendEducationToAi(profile.educationLevel),
    // raw_text strongly improves AI matching quality
    raw_text: resume?.parsedText ?? null,
  };
}

// ─── AI ParsedCandidate → CandidateProfile fields ────────────────────────────

/**
 * Convert a year number (e.g. 2020) to a JS Date (Jan 1 of that year).
 * Returns null when year is falsy.
 */
function yearToDate(year) {
  if (!year) return null;
  return new Date(year, 0, 1);
}

/**
 * Map AI parse response fields onto plain objects ready to write into
 * Resume and CandidateProfile documents.
 *
 * @param {object} parsed  Raw AI ParsedCandidate response body
 * @returns {{ resumeFields: object, profileFields: object }}
 */
function parsedCandidateToBackend(parsed) {
  const resumeFields = {
    parsedText: parsed.raw_text ?? null,
  };

  const profileFields = {
    personalInfo: {
      fullName: parsed.full_name ?? null,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      location: parsed.location ?? null,
    },
    skills: normalizeSkills(parsed.skills || []),
    educationLevel: aiEducationToBackend(parsed.education_level),
    yearsExperience: parsed.years_experience ?? 0,
    certifications: parsed.certifications || [],

    education: (parsed.education || []).map((e) => ({
      institution: e.institution ?? null,
      degree: e.degree ?? null,
      field: e.field ?? null,
      startDate: yearToDate(e.start_year),
      endDate: yearToDate(e.end_year),
    })),

    experience: (parsed.experience?.entries || []).map((e) => ({
      jobTitle: e.role ?? null,
      company: e.company ?? null,
      startDate: yearToDate(e.start_year),
      endDate: yearToDate(e.end_year),
      description: e.description ?? null,
    })),

    projects: (parsed.projects || []).map((p) => ({
      title: p.name ?? null,
      description: p.description ?? null,
      // AI field is 'technologies', backend field is 'techStack'
      techStack: p.technologies || [],
    })),
  };

  return { resumeFields, profileFields };
}

// ─── AI MatchResponse → MatchResult fields ───────────────────────────────────

/**
 * @param {object} ranked  One entry from AI ranked_candidates array
 * @returns {object}       Fields ready to upsert into MatchResult
 */
function aiRankedCandidateToMatchResult(ranked) {
  const breakdown = ranked.score_breakdown || {};
  return {
    // AI returns 0–1; backend stores 0–100
    matchScore: Math.round((ranked.total_score ?? 0) * 100),
    matchedSkills: ranked.matched_skills || [],
    missingSkills: ranked.missing_skills || [],
    scoreBreakdown: {
      skills: breakdown.skills_score ?? null,
      experience: breakdown.experience_score ?? null,
      education: breakdown.education_score ?? null,
      semantic: breakdown.semantic_score ?? null,
    },
    explanation: ranked.readable_summary ?? null,
    reasons: ranked.reasons || [],
  };
}

module.exports = {
  jobToAiInput,
  candidateToAiInput,
  parsedCandidateToBackend,
  aiRankedCandidateToMatchResult,
  aiEducationToBackend,
  normalizeSkills,
};
