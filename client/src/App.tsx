import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { ProfileOnboarding } from "./components/ProfileOnboarding";
import EditorPage from "./pages/EditorPage";
import Home from "./pages/Home";
import ReportPage from "./pages/ReportPage";
import StudyPage from "./pages/StudyPage";
import SettingsPage from "./pages/SettingsPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/editor/:id"} component={EditorPage} />
      <Route path={"/room/:roomCode"} component={Home} />
      <Route path={"/r/:roomCode"} component={Home} />
      <Route path={"/report"} component={ReportPage} />
      <Route path={"/study"} component={StudyPage} />
      <Route path={"/settings"} component={SettingsPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <WorkspaceProvider>
            <ProfileOnboarding><Router /></ProfileOnboarding>
          </WorkspaceProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
