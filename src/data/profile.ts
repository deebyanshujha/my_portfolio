import {
  Award,
  BadgeCheck,
  Binary,
  BookOpen,
  Brain,
  Braces,
  Code2,
  Cpu,
  Database,
  Github,
  Globe2,
  GraduationCap,
  Layers3,
  Linkedin,
  Network,
  Server,
  ShieldCheck,
  Terminal,
  Trophy,
  Wrench,
} from "lucide-react";
import type {
  Achievement,
  Certification,
  CodingProfile,
  EducationItem,
  Metric,
  Project,
  SkillGroup,
} from "../types/portfolio";

export const profile = {
  name: "Deebyanshu Jha",
  title: "Computer Science Undergraduate | Software Engineer Aspirant",
  tagline: "Building reliable software through curiosity and consistency.",
  location: "Vellore, Tamil Nadu, India",
  email: "deebyanshujha@gmail.com",
  phone: "+91 7896511109",
  githubUsername: "deebyanshujha",
  github: "https://github.com/deebyanshujha",
  linkedin: "https://www.linkedin.com/in/deebyanshujha/",
  resumeUrl: `${import.meta.env.BASE_URL}resume/Deebyanshu-Jha-Resume.pdf`,
  lambDocs: "https://deebyanshujha.github.io/docs-lamb/",
  summary:
    "Computer Science undergraduate passionate about backend engineering, operating systems, computer networks, compilers, and scalable software development. I enjoy solving challenging problems, exploring how software works under the hood, and designing clean, efficient, and maintainable applications.",
  recruiterNote:
    "A fundamentals-first engineer focused on clean architecture, resilient backend services, and a deep understanding of core computer science concepts.",
};

export const navItems = [
  { label: "About", href: "#about" },
  { label: "Education", href: "#education" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Achievements", href: "#achievements" },
  { label: "GitHub", href: "#github" },
  { label: "Coding", href: "#coding" },
  { label: "Resume", href: "#resume" },
  { label: "Contact", href: "#contact" },
] as const;

export const heroMetrics: Metric[] = [
  {
    label: "DSA problems solved",
    value: "700+",
    helper: "Across major coding platforms",
  },
  { label: "CGPA", value: "9.12/10", helper: "B.Tech CSE IoT, VIT Vellore" },
  {
    label: "CodeChef",
    value: "2-Star",
    helper: "Competitive programming profile",
  },
  {
    label: "Certifications",
    value: "5",
    helper: "DSA, OOP, SQL, Python, problem solving",
  },
];

export const education: EducationItem[] = [
  {
    school: "Vellore Institute of Technology",
    place: "Vellore, Tamil Nadu",
    program: "B.Tech in Computer Science and Engineering, Internet of Things",
    result: "CGPA: 9.12/10",
    period: "2024 - 2028 expected",
  },
  {
    school: "Pragjyotish Senior Secondary School",
    place: "Guwahati, Assam",
    program: "Senior Secondary, Class XII",
    result: "Percentage: 91.8%",
    period: "2024",
  },
  {
    school: "Pragjyotish Senior Secondary School",
    place: "Guwahati, Assam",
    program: "Secondary, Class X",
    result: "Percentage: 89.8%",
    period: "2022",
  },
];

export const skillGroups: SkillGroup[] = [
  {
    title: "Programming Languages",
    icon: Code2,
    accent: "blue",
    skills: ["C++", "Java", "C", "JavaScript", "Python", "Bash"],
  },
  {
    title: "Backend",
    icon: Server,
    accent: "violet",
    skills: [
      "Node.js",
      "Express.js",
      "REST APIs",
      "JWT Auth",
      "Input validation",
    ],
  },
  {
    title: "Frontend",
    icon: Layers3,
    accent: "mint",
    skills: ["React", "HTML", "CSS", "Responsive interfaces"],
  },
  {
    title: "Databases",
    icon: Database,
    accent: "amber",
    skills: ["MongoDB", "MySQL", "Schema design", "Data modeling"],
  },
  {
    title: "Tools",
    icon: Wrench,
    accent: "blue",
    skills: ["Git", "GitHub", "Postman", "VS Code", "Linux/Bash"],
  },
  {
    title: "Systems",
    icon: Cpu,
    accent: "violet",
    skills: [
      "Operating Systems",
      "Computer Networks",
      "Concurrency",
      "Multithreading",
      "Synchronization",
    ],
  },
  {
    title: "Core CS",
    icon: Brain,
    accent: "mint",
    skills: ["Data Structures", "Algorithms", "DBMS", "OOP", "Problem solving"],
  },
];

export const projects: Project[] = [
  {
    id: "lamb",
    title: "Lamb",
    category: "Compilers",
    subtitle: "Interpreted Programming Language",
    github: "https://github.com/deebyanshujha/Lamb",
    docs: "https://deebyanshujha.github.io/docs-lamb/",
    description:
      "A custom interpreted programming language built in Java with lexical analysis, parsing, AST generation, variable scoping, functions, closures, classes, inheritance, and custom language features.",
    techStack: [
      "Java",
      "Interpreter Design",
      "Recursive Descent Parsing",
      "AST",
      "OOP",
    ],
    features: [
      "Multi-stage compiler pipeline from lexer to scope-based name resolution.",
      "Runtime support for closures, first-class functions, classes, and inheritance.",
      "Dependency-free Java implementation focused on correctness and language reliability.",
    ],
    challenges: [
      "Translated compiler theory into a complete tree-walk interpreter architecture.",
      "Designed scoping and resolution rules that stay predictable under nested functions and classes.",
    ],
    impact:
      "Demonstrates end-to-end ownership of a complex system built from first principles.",
    artifact: [
      "fun fib(n) {",
      "  if (n <= 1) return n;",
      "  return fib(n - 1) + fib(n - 2);",
      "}",
    ],
  },
  {
    id: "chatternet",
    title: "ChatterNet",
    category: "Networking",
    subtitle: "Multi-Client TCP Chat Server",
    github: "https://github.com/deebyanshujha/ChatterNet",
    description:
      "A concurrent TCP chat server in C++ implementing socket programming, real-time communication, persistent chat rooms, direct messaging, broadcasts, and graceful disconnect handling.",
    techStack: [
      "C++",
      "TCP/IP",
      "Socket Programming",
      "Multithreading",
      "Winsock",
    ],
    features: [
      "Supports 50+ simultaneous client connections with low-latency message delivery.",
      "Routes messages across chat rooms, username-based direct messages, and broadcasts.",
      "Logs connection events and error states for debugging and operational visibility.",
    ],
    challenges: [
      "Built thread-safe client management with mutex synchronization.",
      "Eliminated race conditions while preserving responsive multi-client communication.",
    ],
    impact:
      "Shows systems-level thinking around concurrency, reliability, and networked application design.",
    artifact: [
      "client.join(room)",
      "server.route(message)",
      "lock_guard<mutex> guard(clients)",
      "broadcast(room, payload)",
    ],
  },
  {
    id: "project-camp",
    title: "Project Camp",
    category: "Full-stack",
    subtitle: "Project Management Platform",
    github: "https://github.com/deebyanshujha/Project_camp",
    description:
      "A full-stack project management platform with authentication, project organization, hierarchical tasks, nested subtasks, and collaborative workflow features.",
    techStack: [
      "Node.js",
      "Express.js",
      "MongoDB",
      "React",
      "REST API Design",
      "JWT",
    ],
    features: [
      "Role-based membership, project organization, nested subtasks, and team workflows.",
      "Secure REST APIs with JWT authentication, input validation, and structured routing.",
      "Dedicated controller layers and modular architecture for maintainability.",
    ],
    challenges: [
      "Balanced clean data management with collaborative task distribution requirements.",
      "Separated concerns across API, controller, and persistence layers to keep the codebase scalable.",
    ],
    impact:
      "Highlights product engineering judgment across backend architecture, security, and user workflows.",
    artifact: [
      "POST /api/projects",
      "auth.verifyJWT(req)",
      "tasks.createSubtask(parentId)",
      "members.assignRole(userId)",
    ],
  },
];

export const achievements: Achievement[] = [
  {
    title: "Competitive Programming Foundation",
    category: "Problem Solving",
    date: "Ongoing",
    description:
      "Solved 700+ data structures and algorithms problems across LeetCode, CodeChef, GeeksforGeeks, and HackerRank.",
    details: [
      "Arrays",
      "Graphs",
      "Trees",
      "Dynamic programming",
      "System design patterns",
    ],
  },
  {
    title: "LeetCode Performance",
    category: "Competitive Programming",
    date: "Ongoing",
    description:
      "Ranked in the top 25% globally with a top 150,000 worldwide ranking.",
    details: [
      "Reviews optimal solutions",
      "Applies new algorithmic patterns to future problems",
    ],
  },
  {
    title: "CodeChef Rating Milestone",
    category: "Competitive Programming",
    date: "Ongoing",
    description:
      "Earned a 2-Star CodeChef profile through consistent contest and practice work.",
    details: [
      "Rated programming profile",
      "Continuous improvement through feedback",
    ],
  },
  {
    title: "Research Direction",
    category: "Research",
    date: "Ongoing",
    description:
      "Working on Fairness-Aware Multi-Objective ACK Scheduling using Deep Reinforcement Learning.",
    details: ["Networking", "Scheduling", "Deep reinforcement learning"],
  },
  {
    title: "Academic Performance",
    category: "Academic",
    date: "2024 - 2028",
    description:
      "Maintaining a 9.12/10 CGPA in B.Tech Computer Science and Engineering, Internet of Things, at VIT Vellore.",
    details: [
      "Computer Science fundamentals",
      "Internet of Things specialization",
    ],
  },
];

export const certifications: Certification[] = [
  {
    title: "Complete Web Development Course",
    issuer: "Udemy",
    issued: "April 3, 2026",
    credentialId: "UC-71c062f1-52a5-4865-842f-224928f672f8",
    skills: ["Web Development"],
  },
  {
    title: "SQL & Data Engineering Foundations",
    issuer: "takeUforward",
    issued: "June 2026",
    credentialId: "NN1A-tkumJCcA",
    skills: ["SQL", "Data Engineering"],
  },
  {
    title: "Object-Oriented Programming",
    issuer: "takeUforward",
    issued: "May 2026",
    credentialId: "NN1A-OmvHsKev",
    skills: ["Object-Oriented Programming"],
  },
  {
    title: "Data Structures & Algorithms, Basic to Advanced",
    issuer: "takeUforward",
    issued: "May 2026",
    credentialId: "NN1A-hZApq-Ea",
    skills: ["Data Structures", "Algorithms"],
  },
  {
    title: "HackerRank Problem Solving",
    issuer: "HackerRank",
    issued: "October 2025",
    credentialId: "42a396af98be",
    skills: ["Problem Solving"],
  },
  {
    title: "HackerRank Python",
    issuer: "HackerRank",
    issued: "October 2025",
    credentialId: "aa3732e84e19",
    skills: ["Python"],
  },
];

export const codingProfiles: CodingProfile[] = [
  {
    platform: "GitHub",
    href: "https://github.com/deebyanshujha",
    icon: Github,
    stats: [
      { label: "Username", value: "deebyanshujha" },
      { label: "Focus", value: "Compilers, networking, full-stack" },
    ],
  },
  {
    platform: "LeetCode",
    href: "https://leetcode.com/u/deebyanshujha/",
    icon: Trophy,
    stats: [
      { label: "Standing", value: "Top 25%" },
      { label: "Global rank", value: "Top 150,000" },
    ],
  },
  {
    platform: "CodeChef",
    href: "https://www.codechef.com/users/deebyanshujha",
    icon: BadgeCheck,
    stats: [{ label: "Rating band", value: "2-Star Coder" }],
  },
  {
    platform: "GeeksforGeeks",
    href: "https://www.geeksforgeeks.org/profile/deebyanshu_jha?tab=activity",
    icon: BookOpen,
    stats: [{ label: "Activity", value: "DSA practice profile" }],
  },
  {
    platform: "HackerRank",
    href: "https://www.hackerrank.com/profile/jhadeebyanshu",
    icon: Award,
    stats: [
      { label: "Certified", value: "Problem Solving" },
      { label: "Certified", value: "Python" },
    ],
  },
  {
    platform: "Codolio",
    href: "https://codolio.com/profile/deebyanshujha",
    icon: Globe2,
    stats: [{ label: "Profile", value: "Coding activity hub" }],
  },
];

export const focusAreas = [
  { label: "Backend", icon: Server },
  { label: "Systems", icon: Cpu },
  { label: "Compilers", icon: Binary },
  { label: "Algorithms", icon: Braces },
  { label: "Operating Systems", icon: Terminal },
  { label: "Networking", icon: Network },
  { label: "Security-minded APIs", icon: ShieldCheck },
  { label: "Academic depth", icon: GraduationCap },
];

export const socialLinks = [
  { label: "GitHub", href: profile.github, icon: Github },
  { label: "LinkedIn", href: profile.linkedin, icon: Linkedin },
  { label: "Email", href: `mailto:${profile.email}`, icon: Globe2 },
];
