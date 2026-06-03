# HireSignal - User Manual

Welcome to **HireSignal**, an AI-powered resume screening and candidate matching platform. HireSignal streamlines the hiring process by parsing candidates' resumes into structured profiles and ranking applicants based on their fit for specific job requirements.

This manual explains how to use HireSignal as a **Candidate**, as a **Recruiter**, and how the underlying **AI Matching Engine** evaluates applications.

---

## Table of Contents
1. [User Authentication](#1-user-authentication)
2. [Candidate Guide](#2-candidate-guide)
   - [Uploading Resumes](#uploading-resumes)
   - [Managing Your Profile](#managing-your-profile)
   - [Browsing and Applying to Jobs](#browsing-and-applying-to-jobs)
3. [Recruiter Guide](#3-recruiter-guide)
   - [Posting Jobs](#posting-jobs)
   - [Running AI Matching](#running-ai-matching)
   - [Analyzing Candidate Matches](#analyzing-candidate-matches)
   - [Shortlisting and Exporting Results](#shortlisting-and-exporting-results)
4. [AI Matching Details](#4-ai-matching-details)
5. [Troubleshooting & Support](#5-troubleshooting--support)

---

## 1. User Authentication

To use HireSignal, you must create an account. The system supports two user roles: **Candidate** and **Recruiter**.

*   **Registration**: Fill in your full name, email, password, and select your role (Candidate or Recruiter). Once registered, you can log in immediately to access your dashboard.
*   **Security & Password Reset**: If you forget your password, use the **Forgot Password** link on the login screen to receive a secure reset link.

---

## 2. Candidate Guide

As a candidate, HireSignal helps you create a structured, parseable resume profile and apply to relevant job listings.

### Uploading Resumes
1. Navigate to the **Resume Upload** tab.
2. Drag and drop your resume file, or click inside the dashed box to browse files.
   *   **Supported formats**: PDF (`.pdf`) and Word (`.docx`).
   *   **Size Limit**: Maximum file size is **5MB**.
3. Click the **Upload** button to send it to the parsing engine.
4. Once completed, your resume status will update to **Parsed ✓** and display the file name and date.

> [!NOTE]
> Uploading a new resume will automatically replace your current active resume and update your parsed profile values.

### Managing Your Profile
Once parsed, view your structured profile under the **Profile** tab:
*   **Contact Information**: Verify your parsed name, email, phone number, and location.
*   **Name Syncing**: If your resume name differs from your account registration name, you will see a card prompting you to "Accept resume name". Accepting this will update your profile's display name.
*   **Skills**: Displays key tags extracted from your resume.
*   **Experience & Education**: Structured cards detailing your past roles, companies, dates, degrees, and institutions.
*   **Projects & Certifications**: Extracted technology stacks, project names, and achievements.

### Browsing and Applying to Jobs
1. Go to the **Browse Jobs** section.
2. View active job cards which outline the title, department, required experience, and key skills.
3. Click on a job to open the **Job Details** dialog.
4. Click **Apply Now** to submit your application. Your active resume and profile data will be attached to the application.
5. Track your submissions under the **My Applications** tab.

---

## 3. Recruiter Guide

As a recruiter, HireSignal allows you to define job descriptions and utilize machine learning to automatically rank applicants.

### Posting Jobs
1. Select the **Post a Job** view in your dashboard.
2. Complete the job details form:
   *   **Job Title** & **Department** (e.g., Software Engineer, Engineering).
   *   **Job Description**: Summarize role responsibilities.
   *   **Required Skills**: Add comma-separated keywords (e.g., `React, Node.js, Python`).
   *   **Required Experience**: Input minimum years of experience.
   *   **Minimum Education**: Select the threshold (e.g., Bachelor's, Master's, PhD).
3. Save the job to publish it immediately to candidate browsers.

### Running AI Matching
Once candidates begin applying:
1. Navigate to the **My Jobs** tab.
2. Locate the target job and click **View Match Results**.
3. Click the **🤖 Run AI Match** button. This triggers the machine learning engine to evaluate all applicants simultaneously.

### Analyzing Candidate Matches
Candidate match results are presented in a ranked leaderboard. Each candidate card provides:
*   **Total Match Score**: A percentage (0-100%) indicating overall alignment.
*   **Score Breakdown**: The scoring breakdown across 4 criteria (Skills, Experience, Semantic, Education).
*   **Skills Audit**: A comparative list highlighting matched skills in **green** (✓) and missing skills in **red** (✗).
*   **AI Reasoning**: Expand the **Show AI reasoning** section to read natural language summaries explaining why the candidate was ranked at their current score.

### Shortlisting and Exporting Results
*   **Shortlisting**: Click the ⭐ icon next to a candidate's name to shortlist them. Shortlisted candidates are visually badged in green.
*   **CSV Export**: Click the **Export CSV** button at the top-right of the leaderboard to download a spreadsheet featuring all candidates, contact details, total scores, breakdowns, and shortlist statuses.

---

## 4. AI Matching Details

The AI engine matches candidate profiles to job specifications using a weighted four-dimension calculation:

| Criteria | Weight | Evaluation Method |
|---|---|---|
| **Skills** | **40%** | Checks candidate's skills list against required keywords using exact and alias-based matching. |
| **Experience** | **30%** | Compares years of experience in the candidate's profile to the job's minimum requirements. |
| **Semantic Similarity** | **20%** | Computes cosine similarity of text embeddings (`all-MiniLM-L6-v2`) between the job description and the candidate's resume text. |
| **Education Level** | **10%** | Compares the candidate's highest degree against the job's target education level. |

---

## 5. Troubleshooting & Support

### "File is larger than 5MB" or "Unsupported format"
Verify that you are uploading a `.pdf` or `.docx` file and that the size does not exceed 5MB. If you are uploading a Word document, ensure it is saved in the modern `.docx` format rather than the older `.doc` format.

### "No skills detected"
If the parser fails to detect skills, ensure that your resume is text-based and does not consist of scanned images. The PDF must be OCR-readable (you should be able to select and copy text within it).

### Slow Match Times or Timeouts
If the matching engine takes a long time, it may be downloading or loading the embedding model (`all-MiniLM-L6-v2`) for the first time. Subsequent runs will be significantly faster.
