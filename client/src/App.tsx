import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PrintEvaluation from "./pages/PrintEvaluation";
import EditEvaluation from "./pages/EditEvaluation";
import OperationForm from "./pages/OperationForm";
import PrintOperation from "./pages/PrintOperation";
import Profile from "./pages/Profile";
import MilitarDashboard from "./pages/MilitarDashboard";
import { OperationDetail } from "./pages/OperationDetail";
import AdminMigration from "./pages/AdminMigration";
import SuspectProfiles from "./pages/SuspectProfiles";
import OperationAnalysis from "./pages/OperationAnalysis";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profile" component={Profile} />
      <Route path="/militar-dashboard" component={MilitarDashboard} />
      <Route path="/admin/migration" component={AdminMigration} />
      <Route path="/print/:id" component={PrintEvaluation} />
      <Route path="/operation/:evaluationId" component={OperationForm} />
      <Route path="/edit-evaluation/:id" component={EditEvaluation} />
      <Route path="/print-operation/:id" component={PrintOperation} />
      <Route path="/operation-detail/:id" component={OperationDetail} />
      <Route path="/suspect-profiles" component={SuspectProfiles} />
      <Route path="/operation-analysis" component={OperationAnalysis} />
      <Route path="/404" component={NotFound} />
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
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
