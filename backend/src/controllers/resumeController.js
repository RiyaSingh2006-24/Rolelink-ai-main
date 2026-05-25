const fs = require('fs');
const pdfParse = require('pdf-parse');
const PDFDocument = require('pdfkit');
const Job = require('../models/Job');

let openaiClientPromise;

const getOpenAIClient = async () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!openaiClientPromise) {
    openaiClientPromise = import('openai').then(({ default: OpenAI }) => {
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    });
  }

  return openaiClientPromise;
};

const extractPdfText = async (filePath) => {
  const data = await pdfParse(fs.readFileSync(filePath));
  return data.text || '';
};

const getHeuristicAnalysis = (text) => {
  const keywords = [
    'Docker',
    'CI/CD',
    'Kubernetes',
    'AWS',
    'Azure',
    'GCP',
    'TypeScript',
    'React',
    'Node.js',
    'MongoDB',
    'PostgreSQL',
    'Python',
    'Java',
    'Go'
  ];

  const detected = keywords.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
  const missing = keywords.filter((keyword) => !detected.includes(keyword));

  const lengthScore = Math.min(30, Math.floor(text.length / 200));
  const keywordScore = Math.min(50, detected.length * 5);
  const score = Math.min(100, 40 + lengthScore + keywordScore);

  return {
    score,
    missingKeywords: missing.slice(0, 6),
    suggestions: [
      'Add quantified achievements to experience bullet points',
      'Include a concise skills section near the top',
      'Tailor keywords to the job description'
    ],
    skillsDetected: detected
  };
};

const parseJsonResponse = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};

const normalizeAnalysis = (analysis, fallback) => {
  return {
    score: typeof analysis?.score === 'number' ? analysis.score : fallback.score,
    missingKeywords: Array.isArray(analysis?.missingKeywords) ? analysis.missingKeywords : fallback.missingKeywords,
    suggestions: Array.isArray(analysis?.suggestions) ? analysis.suggestions : fallback.suggestions,
    skillsDetected: Array.isArray(analysis?.skillsDetected) ? analysis.skillsDetected : fallback.skillsDetected
  };
};

const scoreJobAgainstSkills = (job, skills) => {
  const text = [
    job.title,
    job.description,
    job.qualifications,
    job.responsibilities,
    job.location,
    job.jobType,
    job.salaryRange
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchedSkills = skills.filter((skill) => text.includes(skill.toLowerCase()));
  const matchScore = skills.length ? Math.round((matchedSkills.length / skills.length) * 100) : 0;

  return { matchedSkills, matchScore };
};

const getRecommendedJobs = async (skills) => {
  if (!skills || skills.length === 0) return [];

  const jobs = await Job.find().populate('employerId', 'name').sort({ createdAt: -1 });

  const scored = jobs
    .map((job) => {
      const { matchedSkills, matchScore } = scoreJobAgainstSkills(job, skills);
      return { job, matchedSkills, matchScore };
    })
    .filter((item) => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5)
    .map(({ job, matchedSkills, matchScore }) => ({
      _id: job._id,
      title: job.title,
      location: job.location || '',
      jobType: job.jobType || '',
      salaryRange: job.salaryRange || '',
      employer: typeof job.employerId === 'object' ? job.employerId?.name || '' : '',
      companyName: job.companyName || '',
      companyLogoUrl: job.companyLogoUrl || '',
      matchScore,
      matchedSkills
    }));

  return scored;
};

const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Resume PDF file is required' });
    }

    const filePath = req.file.path;
    const resumeText = await extractPdfText(filePath);
    const fallbackAnalysis = getHeuristicAnalysis(resumeText);

    const client = await getOpenAIClient();
    if (client) {
      const prompt = `You are an ATS resume analyzer. Analyze the resume text and return ONLY valid JSON with keys: score (0-100), missingKeywords (array of strings), suggestions (array of strings), skillsDetected (array of strings).\n\nResume Text:\n${resumeText}`;
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-5',
        input: prompt
      });

      const outputText = response.output_text || '';
      const parsed = parseJsonResponse(outputText);
      if (parsed && parsed.score !== undefined) {
        const analysis = normalizeAnalysis(parsed, fallbackAnalysis);
        const recommendedJobs = await getRecommendedJobs(analysis.skillsDetected || fallbackAnalysis.skillsDetected);
        return res.json({ ...analysis, recommendedJobs });
      }
    }

    const analysis = fallbackAnalysis;
    const recommendedJobs = await getRecommendedJobs(analysis.skillsDetected);
    return res.json({ ...analysis, recommendedJobs });
  } catch (error) {
    return res.status(500).json({ message: 'Resume analysis failed', error: error.message });
  }
};

const normalizeProjects = (projects) => {
  if (Array.isArray(projects)) {
    return projects
      .map((project) => ({
        name: project?.name || '',
        link: project?.link || '',
        description: project?.description || ''
      }))
      .filter((project) => project.name || project.description || project.link);
  }

  if (typeof projects === 'string' && projects.trim()) {
    return [{ name: projects.trim(), link: '', description: '' }];
  }

  return [];
};

const buildFallbackResume = ({
  name,
  email,
  phone,
  location,
  skills,
  education,
  experience,
  certifications,
  achievements,
  competitions,
  github,
  linkedin,
  portfolio,
  projects,
  skillsCategories
}) => {
  const skillsText = Array.isArray(skills) ? skills.join(', ') : skills || '';
  const projectLines = normalizeProjects(projects)
    .map((project, index) => {
      const linkPart = project.link ? ` (${project.link})` : '';
      const lines = [];
      lines.push(`Project ${index + 1}${linkPart}`);
      lines.push(project.name || `Project ${index + 1}`);
      if (project.description) {
        lines.push(`- ${project.description}`);
      } else {
        lines.push('- Add 1-2 impact-focused bullets');
      }
      return lines.join('\n');
    })
    .join('\n');

  const contactParts = [
    location || '',
    linkedin ? `LinkedIn: ${linkedin}` : '',
    github ? `GitHub: ${github}` : '',
    portfolio ? `Portfolio: ${portfolio}` : '',
    phone ? `Phone: ${phone}` : '',
    email ? `Email: ${email}` : ''
  ].filter(Boolean);

  const educationLines = (education || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const experienceLines = (experience || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith('-') ? line : `- ${line}`));

  const certificationLines = (certifications || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith('-') ? line : `- ${line}`));

  const achievementLines = (achievements || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith('-') ? line : `- ${line}`));

  const competitionLines = (competitions || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith('-') ? line : `- ${line}`));

  const skillsSectionLines = [];
  if (skillsCategories?.programmingLanguages) {
    skillsSectionLines.push(`- Programming Languages: ${skillsCategories.programmingLanguages}`);
  }
  if (skillsCategories?.webTechnologies) {
    skillsSectionLines.push(`- Web Technologies: ${skillsCategories.webTechnologies}`);
  }
  if (skillsCategories?.databases) {
    skillsSectionLines.push(`- Databases: ${skillsCategories.databases}`);
  }
  if (skillsCategories?.tools) {
    skillsSectionLines.push(`- Tools: ${skillsCategories.tools}`);
  }
  if (skillsCategories?.interests) {
    skillsSectionLines.push(`- Interests: ${skillsCategories.interests}`);
  }
  if (!skillsSectionLines.length && skillsText) {
    skillsSectionLines.push(`- Skills: ${skillsText}`);
  }

  const sections = [];
  sections.push(name);
  if (contactParts.length) {
    sections.push(contactParts.join(' | '));
  }
  sections.push('EDUCATION');
  sections.push(educationLines.length ? educationLines.join('\n') : 'Add education details');

  if (certificationLines.length) {
    sections.push('LICENSES AND CERTIFICATIONS');
    sections.push(certificationLines.join('\n'));
  }

  if (experienceLines.length) {
    sections.push('EXPERIENCE');
    sections.push(experienceLines.join('\n'));
  }

  sections.push('PROJECTS AND ACHIEVEMENTS');
  sections.push(projectLines || '- Add 2-3 projects with outcomes and tech stack');
  if (achievementLines.length) {
    sections.push(achievementLines.join('\n'));
  }

  if (competitionLines.length) {
    sections.push('COMPETITION EXPERIENCE');
    sections.push(competitionLines.join('\n'));
  }

  if (skillsSectionLines.length) {
    sections.push('SKILLS AND INTERESTS');
    sections.push(skillsSectionLines.join('\n'));
  }

  return sections.join('\n');
};

const generateResume = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      location,
      skills,
      education,
      experience,
      certifications,
      achievements,
      competitions,
      projects,
      github,
      linkedin,
      portfolio,
      skillsCategories
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const normalizedProjects = normalizeProjects(projects);

    const client = await getOpenAIClient();
    if (client) {
      const projectText = normalizedProjects
        .map((project, index) => {
          const linkPart = project.link ? ` (${project.link})` : '';
          const descPart = project.description ? `- ${project.description}` : '- Add impact-focused bullet';
          const projectName = project.name || `Project ${index + 1}`;
          return `Project ${index + 1}${linkPart}\n${projectName}\n${descPart}`;
        })
        .join('\n');

      const prompt = `You are an expert resume writer. Generate a clean, ATS-friendly resume in plain text that matches the style below. Use uppercase section headers, "-" bullets, and concise action-focused lines. Omit any section that has no data.\n\nSTYLE TEMPLATE (order matters):\nFull Name (single line)\nContact line: Location | LinkedIn | GitHub | Portfolio | Phone | Email (include only provided)\nEDUCATION\n- lines with school, degree, GPA, years\nLICENSES AND CERTIFICATIONS (optional)\n- Certificate name and a short skills learned line\nEXPERIENCE (optional)\n- Company | Role | Dates\n- Impact bullet\nPROJECTS AND ACHIEVEMENTS\nProject 1 (link or "Live demo" if provided)\nProject Name\n- 1-2 impact bullets\nCOMPETITION EXPERIENCE (optional)\n- Competition detail\nSKILLS AND INTERESTS\n- Programming Languages: ...\n- Web Technologies: ...\n- Databases: ...\n- Tools: ...\n- Interests: ...\n\nINPUT:\nName: ${name}\nLocation: ${location || ''}\nPhone: ${phone || ''}\nEmail: ${email || ''}\nGitHub: ${github || ''}\nLinkedIn: ${linkedin || ''}\nPortfolio: ${portfolio || ''}\nSkills Summary: ${Array.isArray(skills) ? skills.join(', ') : skills || ''}\nEducation:\n${education || ''}\nCertifications:\n${certifications || ''}\nExperience:\n${experience || ''}\nProjects:\n${projectText || ''}\nAchievements:\n${achievements || ''}\nCompetitions:\n${competitions || ''}\nSkills Categories:\nProgramming Languages: ${skillsCategories?.programmingLanguages || ''}\nWeb Technologies: ${skillsCategories?.webTechnologies || ''}\nDatabases: ${skillsCategories?.databases || ''}\nTools: ${skillsCategories?.tools || ''}\nInterests: ${skillsCategories?.interests || ''}`;

      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-5',
        input: prompt
      });

      const outputText = response.output_text || '';
      if (outputText) {
        return res.json({ resumeText: outputText });
      }
    }

    const resumeText = buildFallbackResume({
      name,
      email,
      phone,
      location,
      skills,
      education,
      experience,
      certifications,
      achievements,
      competitions,
      github,
      linkedin,
      portfolio,
      projects: normalizedProjects,
      skillsCategories
    });

    return res.json({ resumeText });
  } catch (error) {
    return res.status(500).json({ message: 'Resume generation failed', error: error.message });
  }
};

const generateResumePdf = async (req, res) => {
  try {
    const { resumeText, name } = req.body;

    if (!resumeText || !name) {
      return res.status(400).json({ message: 'Name and resumeText are required' });
    }

    const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName || 'resume'}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    const lines = resumeText.split(/\r?\n/);
    const isSectionHeader = (text) => /^[A-Z][A-Z\s&/]+$/.test(text);
    const isContactLine = (text) =>
      text.includes('|') ||
      /linkedin|github|portfolio|email|phone/i.test(text) ||
      text.includes('@');

    const drawSectionHeader = (text) => {
      doc.moveDown(0.2);
      doc.font('Helvetica-Bold').fontSize(11).text(text);
      const lineY = doc.y + 2;
      doc
        .moveTo(doc.page.margins.left, lineY)
        .lineTo(doc.page.width - doc.page.margins.right, lineY)
        .strokeColor('#000000')
        .lineWidth(0.6)
        .stroke();
      doc.moveDown(0.4);
      doc.font('Helvetica').fontSize(10.5);
    };

    let namePrinted = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        doc.moveDown(0.5);
        return;
      }

      if (trimmed.startsWith('# ')) {
        doc.font('Helvetica-Bold').fontSize(18).text(trimmed.replace(/^#\s+/, ''), { align: 'center' });
        doc.moveDown(0.2);
        namePrinted = true;
        return;
      }

      if (!namePrinted && !isSectionHeader(trimmed)) {
        doc.font('Helvetica-Bold').fontSize(18).text(trimmed, { align: 'center' });
        doc.moveDown(0.2);
        namePrinted = true;
        return;
      }

      if (isContactLine(trimmed)) {
        doc.font('Helvetica').fontSize(10).text(trimmed, { align: 'center' });
        doc.moveDown(0.4);
        return;
      }

      if (trimmed.startsWith('## ')) {
        drawSectionHeader(trimmed.replace(/^##\s+/, '').toUpperCase());
        return;
      }

      if (isSectionHeader(trimmed)) {
        drawSectionHeader(trimmed);
        return;
      }

      if (trimmed.startsWith('- ')) {
        doc.font('Helvetica').fontSize(10.5).text(`- ${trimmed.slice(2)}`, {
          indent: 14,
          continued: false
        });
        return;
      }

      if (/^Project\s+\d+/i.test(trimmed) || /live demo/i.test(trimmed)) {
        doc.font('Helvetica-Bold').fontSize(10.5).text(trimmed);
        return;
      }

      if (/^Skills (Used|Learnt|Learned):/i.test(trimmed)) {
        doc.font('Helvetica-Oblique').fontSize(10.2).text(trimmed);
        return;
      }

      doc.font('Helvetica').fontSize(10.5).text(trimmed);
    });

    doc.end();
  } catch (error) {
    return res.status(500).json({ message: 'Resume PDF generation failed', error: error.message });
  }
};

module.exports = { analyzeResume, generateResume, generateResumePdf };
