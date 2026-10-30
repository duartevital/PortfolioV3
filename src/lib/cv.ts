export const PROFILE = {
  name: 'Duarte Vital',
  role: 'Software Engineer',
  location: 'Utrecht, Netherlands',
  email: 'duartevital@outlook.com',
  linkedin: 'https://www.linkedin.com/in/duarte-vital',
  summary:
    'Detail-oriented and results-driven Software Engineer with 4+ years of hands-on commercial software development experience. Proficient in modern backend and frontend frameworks, including .NET Core, Vue, and Angular, alongside cloud platforms like Microsoft Azure. Adept at designing and implementing complex web applications, ensuring optimal performance and readable code. Highly proficient in integrating AI-driven workflows using tools like Claude Code and implementing AI features. Proven ability to collaborate with cross-functional international teams, meet project deadlines, and adapt to evolving technologies.',
};

export interface Experience {
  role: string;
  company: string;
  location: string;
  period: string;
  highlights: string[];
  technologies: string[];
}

export const EXPERIENCE: Experience[] = [
  {
    role: 'Backend Software Engineer',
    company: 'Dialog B.V.',
    location: 'Utrecht, Netherlands',
    period: '08/2024 – Present',
    highlights: [
      'Contributed to the development of an innovative HR Management Platform focused on performance, talent, and engagement management.',
      'Developed and maintained robust, cloud-native applications by building the backend infrastructure utilizing .NET (C#) and deploying scalable, secure solutions on Microsoft Azure.',
      'Crafted dynamic, interactive, and responsive user interfaces using Angular with TypeScript.',
      'Optimized development workflows using AI tools like Claude Code and implemented intelligent, AI-driven platform features utilizing the Microsoft Agent Framework.',
    ],
    technologies: ['.NET', 'C#', 'Angular', 'TypeScript', 'Microsoft Azure', 'Claude Code', 'Microsoft Agent Framework'],
  },
  {
    role: 'Full-stack Software Engineer',
    company: 'CDI S.A.',
    location: 'Bern, Switzerland',
    period: '11/2022 – 03/2024',
    highlights: [
      'Played a key role in the development of a comprehensive Health System aimed at facilitating the monitoring, scheduling, and registration processes for breast cancer patients within the Irish health system.',
      'Streamlined healthcare workflows, enhanced patient care, and optimised administrative processes.',
      'Employed .NET Core capabilities to develop the backend infrastructure, implementing robust APIs, data models, and business logic.',
      'Utilized best practices and design patterns to ensure the scalability, reliability, and maintainability of the system.',
      'Crafted an intuitive user interface using the Vue.js framework, implementing dynamic data visualisation, interactive forms, and responsive layouts.',
    ],
    technologies: ['.NET Core', 'C#', 'SQL', 'Vue.js', 'TypeScript'],
  },
  {
    role: 'Front-end Software Engineer',
    company: 'VTXRM',
    location: 'Lisbon, Portugal',
    period: '06/2021 – 06/2022',
    highlights: [
      'Contributed to the development and maintenance of a Multi-Page Web Application used as an enterprise financial management tool for the commerce and trading of motor vehicles.',
      'Executed design enhancements, code optimizations, bug fixing, and the implementation of new functionalities upon client request.',
      'Developed utilizing the ASP.NET WebForms programming model with C# as the main programming language, alongside JavaScript and SQL.',
    ],
    technologies: ['C#', 'ASP.NET WebForms', 'SQL', 'Angular', 'JavaScript'],
  },
  {
    role: 'DevOps Engineering Intern',
    company: 'Timestamp S.A.',
    location: 'Lisbon, Portugal',
    period: '01/2021 – 06/2021',
    highlights: [],
    technologies: [],
  },
];

export interface Education {
  degree: string;
  school: string;
  period: string;
  highlights: { text: string; link?: { label: string; href: string } }[];
}

export const EDUCATION: Education[] = [
  {
    degree: 'Masters in Computer Engineering',
    school: 'ISCTE – Instituto Universitário de Lisboa',
    period: '09/2018 – 12/2020',
    highlights: [
      {
        text: 'Thesis Project: Developed an Air Pollution Analysis desktop application for environmental experts using the Electron framework (NodeJS), JavaScript, HTML/CSS, and Mapbox GL JS API.',
      },
      {
        text: 'Publication: Research resulted in an article published in the International Journal of Creative Interfaces and Computer Graphics (IJCICG).',
        link: {
          label: 'Read the article',
          href: 'https://drive.google.com/file/d/1P4epbvgIzc643aD9tOOhYUTTW4vbRGlm/view',
        },
      },
    ],
  },
  {
    degree: 'Bachelors in Computer Engineering',
    school: 'ISCTE – Instituto Universitário de Lisboa',
    period: '08/2015 – 07/2018',
    highlights: [],
  },
];

export const LANGUAGES = [
  { language: 'Portuguese', level: 'Native' },
  { language: 'English', level: 'C2 (Understanding, Speaking, Writing)' },
];
