import { motion } from "motion/react";
import { Footer } from "../components/layout/Footer";
import { About } from "../components/sections/About";
import { Achievements } from "../components/sections/Achievements";
import { CodingProfiles } from "../components/sections/CodingProfiles";
import { Contact } from "../components/sections/Contact";
import { Education } from "../components/sections/Education";
import { GithubActivity } from "../components/sections/GithubActivity";
import { Hero } from "../components/sections/Hero";
import { Projects } from "../components/sections/Projects";
import { Resume } from "../components/sections/Resume";
import { Skills } from "../components/sections/Skills";

export default function HomePage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.35 }}
    >
      <Hero />
      <About />
      <Education />
      <Skills />
      <Projects />
      <Achievements />
      <GithubActivity />
      <CodingProfiles />
      <Resume />
      <Contact />
      <Footer />
    </motion.main>
  );
}
