// Mock Seed Data for Mychat (Job-Listing Real-time Chat App)

export const INITIAL_USERS = [
  {
    id: 'usr_sarah',
    name: 'Sarah Jenkins',
    email: 'sarah.j@devspace.io',
    role: 'Candidate', // Candidate | Employer | Recruiter
    jobTitle: 'Senior Fullstack Vue & Node Engineer',
    company: 'Available for Hire',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    color: '#8b5cf6',
    status: 'online',
    bio: 'Passionate frontend craftsman specializing in Vue 3, Vite, Real-time WebSockets, and Node.js. 6+ years experience.',
    skills: ['Vue 3', 'TypeScript', 'Node.js', 'Firebase', 'WebSockets', 'CSS3/Tailwind'],
    statusTag: 'Interviewing', // Screening | Interviewing | Offered | Hired
    salaryExpectation: '$120,000 - $140,000 / yr',
    location: 'San Francisco, CA (Remote)'
  },
  {
    id: 'usr_alex',
    name: 'Alex Mercer',
    email: 'alex.m@techcorp.com',
    role: 'Employer',
    jobTitle: 'Head of Engineering',
    company: 'TechCorp Solutions',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    color: '#6366f1',
    status: 'online',
    bio: 'Building high-scale cloud infrastructure & AI platforms at TechCorp. Currently hiring Senior Vue Devs!',
    skills: ['System Design', 'Cloud Architecture', 'Team Leadership'],
    statusTag: 'Hiring Manager',
    salaryExpectation: 'N/A',
    location: 'Austin, TX'
  },
  {
    id: 'usr_elena',
    name: 'Elena Rostova',
    email: 'elena@innovatex.hr',
    role: 'Recruiter',
    jobTitle: 'Senior Tech Talent Lead',
    company: 'InnovateX Talent',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: '#ec4899',
    status: 'away',
    bio: 'Matching top 1% tech talent with high-growth engineering startups globally.',
    skills: ['Technical Sourcing', 'Interview Prep', 'Executive Search'],
    statusTag: 'Recruiter',
    salaryExpectation: 'N/A',
    location: 'New York, NY'
  },
  {
    id: 'usr_michael',
    name: 'Michael Chen',
    email: 'm.chen@designhub.io',
    role: 'Candidate',
    jobTitle: 'Lead Product & UI/UX Designer',
    company: 'Open for Roles',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    color: '#0ea5e9',
    status: 'online',
    bio: 'Crafting pixel-perfect design systems, glassmorphism UI interfaces & micro-interactions.',
    skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping', 'CSS3'],
    statusTag: 'Screening',
    salaryExpectation: '$110,000 - $130,000 / yr',
    location: 'Seattle, WA (Remote)'
  },
  {
    id: 'usr_sophia',
    name: 'Sophia Al-Mansoor',
    email: 'sophia@cloudpulse.io',
    role: 'Employer',
    jobTitle: 'VP of Product',
    company: 'CloudPulse Analytics',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    color: '#10b981',
    status: 'offline',
    bio: 'Scaling real-time metrics tools for dev teams.',
    skills: ['Product Strategy', 'SaaS', 'Vue Ecosystem'],
    statusTag: 'Hiring Manager',
    salaryExpectation: 'N/A',
    location: 'London, UK'
  }
];

export const INITIAL_CHANNELS = [
  {
    id: 'chn_frontend_hiring',
    name: 'frontend-hiring-hub',
    description: 'Discussion channel for Senior Vue.js & Frontend position applicants.',
    type: 'group',
    isPrivate: false,
    members: ['usr_sarah', 'usr_alex', 'usr_elena', 'usr_michael'],
    createdBy: 'usr_alex',
    createdAt: '2026-09-20T10:00:00Z',
    jobContext: {
      title: 'Senior Vue 3 Frontend Architect',
      company: 'TechCorp Solutions',
      location: 'Remote / US',
      salary: '$130k - $160k',
      type: 'Full-Time'
    }
  },
  {
    id: 'chn_candidate_qa',
    name: 'candidate-q-and-a',
    description: 'Ask questions directly to hiring managers & talent leads!',
    type: 'group',
    isPrivate: false,
    members: ['usr_sarah', 'usr_alex', 'usr_elena', 'usr_michael', 'usr_sophia'],
    createdBy: 'usr_elena',
    createdAt: '2026-09-21T12:00:00Z',
    jobContext: null
  },
  {
    id: 'chn_techcorp_interview',
    name: 'techcorp-interview-squad',
    description: 'Internal alignment channel for candidate evaluations.',
    type: 'group',
    isPrivate: true,
    members: ['usr_alex', 'usr_elena', 'usr_sophia'],
    createdBy: 'usr_alex',
    createdAt: '2026-09-22T14:30:00Z',
    jobContext: {
      title: 'Engineering Interview Panel',
      company: 'TechCorp Solutions',
      location: 'Internal',
      salary: '',
      type: 'Internal'
    }
  }
];

export const INITIAL_DIRECT_MESSAGES = [
  {
    id: 'dm_sarah_alex',
    partnerId: 'usr_alex',
    type: 'direct',
    jobContext: {
      title: 'Senior Vue Engineer Interview',
      company: 'TechCorp Solutions',
      jobId: 'JOB-9042'
    }
  },
  {
    id: 'dm_sarah_elena',
    partnerId: 'usr_elena',
    type: 'direct',
    jobContext: {
      title: 'Talent Screening & Compensation Discussion',
      company: 'InnovateX Recruiting',
      jobId: 'REC-1102'
    }
  },
  {
    id: 'dm_sarah_michael',
    partnerId: 'usr_michael',
    type: 'direct',
    jobContext: null
  }
];

export const INITIAL_MESSAGES = [
  // Channel frontend-hiring-hub messages
  {
    id: 'msg_101',
    chatId: 'chn_frontend_hiring',
    senderId: 'usr_alex',
    content: 'Welcome everyone! We are thrilled to kick off discussions for the Senior Vue 3 Architect position at TechCorp. Feel free to share your resume or ask any technical stack questions here!',
    timestamp: '2026-09-24T09:15:00Z',
    reactions: { '👍': ['usr_sarah', 'usr_michael'], '🚀': ['usr_elena'] },
    attachments: []
  },
  {
    id: 'msg_102',
    chatId: 'chn_frontend_hiring',
    senderId: 'usr_sarah',
    content: 'Hi Alex & team! I excited about this role. Here is my updated resume detailing my recent work with Vue 3 script setup, Pinia, and WebSockets.',
    timestamp: '2026-09-24T09:20:00Z',
    reactions: { '❤️': ['usr_alex'], '💡': ['usr_elena'] },
    attachments: [
      {
        id: 'att_1',
        name: 'Sarah_Jenkins_Resume_2026.pdf',
        size: '1.4 MB',
        type: 'application/pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      }
    ]
  },
  {
    id: 'msg_103',
    chatId: 'chn_frontend_hiring',
    senderId: 'usr_elena',
    content: 'Sarah, your background in real-time UI components looks stellar! Alex, should we schedule the system design round for tomorrow?',
    timestamp: '2026-09-24T09:25:00Z',
    reactions: { '🔥': ['usr_sarah'] },
    attachments: []
  },
  {
    id: 'msg_104',
    chatId: 'chn_frontend_hiring',
    senderId: 'usr_michael',
    content: 'Here is a quick UI mockup proposal I drew up for the dashboard analytics component.',
    timestamp: '2026-09-24T09:30:00Z',
    reactions: { '🎨': ['usr_alex'] },
    attachments: [
      {
        id: 'att_2',
        name: 'Dashboard_Analytics_Mockup.png',
        size: '2.8 MB',
        type: 'image/png',
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80'
      }
    ]
  },

  // DM Sarah - Alex messages
  {
    id: 'msg_201',
    chatId: 'dm_sarah_alex',
    senderId: 'usr_alex',
    content: 'Hello Sarah! I reviewed your code samples on GitHub for the real-time chat app. Impressive work on the reactive state management.',
    timestamp: '2026-09-24T10:00:00Z',
    reactions: { '🙌': ['usr_sarah'] },
    attachments: []
  },
  {
    id: 'msg_202',
    chatId: 'dm_sarah_alex',
    senderId: 'usr_sarah',
    content: 'Thank you Alex! I built it with Vue 3 and Firebase/WebSocket synchronization. Would love to run through a quick demo on a call.',
    timestamp: '2026-09-24T10:05:00Z',
    reactions: { '👍': ['usr_alex'] },
    attachments: []
  },
  {
    id: 'msg_203',
    chatId: 'dm_sarah_alex',
    senderId: 'usr_alex',
    content: 'Sounds great! Sending over the official job description document for your review.',
    timestamp: '2026-09-24T10:10:00Z',
    reactions: {},
    attachments: [
      {
        id: 'att_3',
        name: 'TechCorp_Senior_Vue_JobSpec.pdf',
        size: '540 KB',
        type: 'application/pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      }
    ]
  },

  // DM Sarah - Elena messages
  {
    id: 'msg_301',
    chatId: 'dm_sarah_elena',
    senderId: 'usr_elena',
    content: 'Hi Sarah! InnovateX has 2 other tech clients looking for Vue leads with remote flexibility. Are you open to comparing offers?',
    timestamp: '2026-09-24T11:00:00Z',
    reactions: { '👀': ['usr_sarah'] },
    attachments: []
  }
];
