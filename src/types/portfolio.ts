export type ExternalLink = {
  label: string;
  href: string;
};

export type Metric = {
  label: string;
  value: string;
  helper?: string;
};

export type EducationItem = {
  school: string;
  place: string;
  program: string;
  result: string;
  period: string;
};

export type SkillGroup = {
  title: string;
  accent: "blue" | "violet" | "mint" | "amber";
  skills: string[];
};

export type Project = {
  id: string;
  title: string;
  category: "Compilers" | "Networking" | "Full-stack";
  subtitle: string;
  description: string;
  github: string;
  docs?: string;
  techStack: string[];
  features: string[];
  challenges: string[];
  impact: string;
  /** a few real lines from the project, used as its source-file preview */
  artifact: string[];
};

export type Achievement = {
  title: string;
  category: string;
  date: string;
  description: string;
  details: string[];
};

export type Certification = {
  title: string;
  issuer: string;
  issued: string;
  credentialId: string;
  skills: string[];
};

export type CodingProfile = {
  platform: string;
  href: string;
  stats: Metric[];
};
