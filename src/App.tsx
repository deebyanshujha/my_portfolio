import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Route, Switch, useLocation } from "react-router-dom";
import { CommandPalette } from "./components/layout/CommandPalette";
import { CursorGlow } from "./components/layout/CursorGlow";
import { LoadingScreen } from "./components/layout/LoadingScreen";
import { Navbar } from "./components/layout/Navbar";
import { ScrollProgress } from "./components/layout/ScrollProgress";
import { Toaster } from "./components/ui/toast";
import { ToastProvider } from "./components/ui/toast-provider";

const HomePage = lazy(() => import("./pages/HomePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location.pathname}>
        <Route exact path="/" component={HomePage} />
        <Route component={NotFoundPage} />
      </Switch>
    </AnimatePresence>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("deebyanshu-theme") || "dark";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    const timer = window.setTimeout(() => setIsLoading(false), 950);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <div className="min-h-screen overflow-x-hidden bg-canvas text-primary selection:bg-electric/30 selection:text-white">
          <CursorGlow />
          <ScrollProgress />
          <AnimatePresence>{isLoading && <LoadingScreen />}</AnimatePresence>
          <Navbar />
          <Suspense
            fallback={
              <motion.div
                className="grid min-h-screen place-items-center bg-canvas text-sm text-secondary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Loading portfolio
              </motion.div>
            }
          >
            <AnimatedRoutes />
          </Suspense>
          <CommandPalette />
          <Toaster />
        </div>
      </ToastProvider>
    </MotionConfig>
  );
}
