const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Server } = require('socket.io');
const connectDatabase = require('./src/config/database');
const Job = require('./src/models/Job');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./src/docs/openapi');
const { setSocketServer } = require('./src/services/socketService');

const authRoutes = require('./src/routes/authRoutes');
const jobRoutes = require('./src/routes/jobRoutes');
const applicationRoutes = require('./src/routes/applicationRoutes');
const resumeRoutes = require('./src/routes/resumeRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({
    message: 'RoleLink backend is running',
    docs: '/api/docs',
    health: '/api/health'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'rolelink-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/api/docs.json', (req, res) => res.json(openapiSpec));

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Resume PDF must be smaller than 5 MB.' : error.message;
    return res.status(400).json({ message });
  }

  if (error?.message === 'Please upload a valid PDF resume.') {
    return res.status(400).json({ message: error.message });
  }

  return next(error);
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const io = new Server(server, {
  cors: corsOrigin ? { origin: corsOrigin } : { origin: true }
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Unauthorized'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id role');
    if (!user) {
      return next(new Error('Unauthorized'));
    }

    socket.user = user;
    return next();
  } catch (error) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.user._id.toString()}`);
});

setSocketServer(io);

const startServer = async () => {
  try {
    await connectDatabase();
    await seedJobsIfEmpty();
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

async function seedJobsIfEmpty() {
  const existing = await Job.find({}, 'title companyName').lean();
  const existingKeys = new Set(
    existing.map((job) => `${(job.companyName || '').toLowerCase()}|${job.title.toLowerCase()}`)
  );

  let seedEmployer = await User.findOne({ email: 'seed-employer@rolelink.ai' });
  if (!seedEmployer) {
    const hashedPassword = await bcrypt.hash('SeedEmployer@123', 10);
    seedEmployer = await User.create({
      name: 'RoleLink Hiring',
      email: 'seed-employer@rolelink.ai',
      password: hashedPassword,
      role: 'employer',
      skills: [],
      education: '',
      experience: ''
    });
  }

  const jobs = [
    {
      companyName: 'NovaStack',
      companyLogoUrl: '/logos/novastack.svg',
      title: 'Frontend Engineer',
      description: 'Build polished UI experiences for a B2B analytics platform.',
      qualifications: 'React, TypeScript, Tailwind, REST APIs',
      responsibilities: 'Own UI features, improve performance, collaborate with design',
      location: 'Remote',
      salaryRange: '$90K - $130K',
      jobType: 'Full-time',
      employerId: seedEmployer._id
    },
    {
      companyName: 'CloudNova',
      companyLogoUrl: '/logos/cloudnova.svg',
      title: 'Backend Engineer',
      description: 'Design scalable Node.js services for high-traffic systems.',
      qualifications: 'Node.js, MongoDB, Redis, Docker',
      responsibilities: 'API design, data modeling, reliability improvements',
      location: 'Bengaluru, IN',
      salaryRange: '$80K - $120K',
      jobType: 'Full-time',
      employerId: seedEmployer._id
    },
    {
      companyName: 'PixelLoop',
      companyLogoUrl: '/logos/pixelloop.svg',
      title: 'UI/UX Designer',
      description: 'Craft intuitive workflows and clean visual systems.',
      qualifications: 'Figma, Design Systems, Prototyping',
      responsibilities: 'Lead UX research, prototype flows, handoff to engineering',
      location: 'Hyderabad, IN',
      salaryRange: '$45K - $70K',
      jobType: 'Full-time',
      employerId: seedEmployer._id
    },
    {
      companyName: 'DataPulse',
      companyLogoUrl: '/logos/datapulse.svg',
      title: 'Full Stack Developer',
      description: 'Ship full-stack features across React and Node APIs.',
      qualifications: 'React, Node.js, PostgreSQL, AWS',
      responsibilities: 'Build end-to-end features, write tests, deploy pipelines',
      location: 'Remote',
      salaryRange: '$100K - $140K',
      jobType: 'Full-time',
      employerId: seedEmployer._id
    },
    {
      companyName: 'SecureArc',
      companyLogoUrl: '/logos/securearc.svg',
      title: 'Security Engineer',
      description: 'Improve identity and access security for SaaS platform.',
      qualifications: 'IAM, OAuth, Security best practices',
      responsibilities: 'Threat modeling, implement auth improvements, audits',
      location: 'Pune, IN',
      salaryRange: '$90K - $130K',
      jobType: 'Full-time',
      employerId: seedEmployer._id
    },
    {
      companyName: 'InsightOps',
      companyLogoUrl: '/logos/insightops.svg',
      title: 'Data Analyst',
      description: 'Analyze product usage and build KPI dashboards.',
      qualifications: 'SQL, Python, Tableau/PowerBI',
      responsibilities: 'Reporting, insights, stakeholder communication',
      location: 'Mumbai, IN',
      salaryRange: '$50K - $80K',
      jobType: 'Full-time',
      employerId: seedEmployer._id
    },
    {
      companyName: 'DevSpring',
      companyLogoUrl: '/logos/devspring.svg',
      title: 'DevOps Engineer',
      description: 'Automate CI/CD and manage cloud infra.',
      qualifications: 'CI/CD, Docker, Kubernetes, AWS',
      responsibilities: 'Pipeline optimization, infra as code, monitoring',
      location: 'Remote',
      salaryRange: '$95K - $135K',
      jobType: 'Full-time',
      employerId: seedEmployer._id
    },
    {
      companyName: 'Productify',
      companyLogoUrl: '/logos/productify.svg',
      title: 'Product Manager',
      description: 'Drive roadmap and delivery for core product suite.',
      qualifications: 'Product strategy, analytics, stakeholder management',
      responsibilities: 'Define roadmap, gather feedback, manage releases',
      location: 'Delhi, IN',
      salaryRange: '$70K - $100K',
      jobType: 'Full-time',
      employerId: seedEmployer._id
    },
    {
      companyName: 'GrowthHive',
      companyLogoUrl: '/logos/growthhive.svg',
      title: 'Growth Marketer',
      description: 'Scale acquisition channels and improve conversion.',
      qualifications: 'SEO, Paid ads, Analytics',
      responsibilities: 'Campaigns, attribution, funnel optimization',
      location: 'Remote',
      salaryRange: '$40K - $60K',
      jobType: 'Part-time',
      employerId: seedEmployer._id
    },
    {
      companyName: 'StarterX',
      companyLogoUrl: '/logos/starterx.svg',
      title: 'Software Engineering Intern',
      description: 'Join the engineering team to build internal tools.',
      qualifications: 'JavaScript/TypeScript, Git, APIs',
      responsibilities: 'Ship features with mentoring and code reviews',
      location: 'Remote',
      salaryRange: '$10K - $15K',
      jobType: 'Internship',
      employerId: seedEmployer._id
    }
  ];

  const toInsert = [];
  for (const job of jobs) {
    const key = `${(job.companyName || '').toLowerCase()}|${job.title.toLowerCase()}`;
    const exists = existingKeys.has(key);
    if (exists) {
      await Job.updateOne(
        { companyName: job.companyName, title: job.title },
        { $set: { companyLogoUrl: job.companyLogoUrl, jobType: job.jobType } }
      );
    } else {
      toInsert.push(job);
    }
  }

  if (toInsert.length > 0) {
    await Job.insertMany(toInsert);
    console.log(`Seeded ${toInsert.length} starter jobs`);
  }
}
