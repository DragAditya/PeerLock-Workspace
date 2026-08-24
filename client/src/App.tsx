import { WorkspaceProvider } from "@/app/WorkspaceProvider";
import { Route, Switch } from "wouter";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { lazy, Suspense } from "react";

const HubPage = lazy(() => import("@/pages/HubPage").then(module => ({ default: module.HubPage })));
const StudioPage = lazy(() => import("@/pages/StudioPage").then(module => ({ default: module.StudioPage })));
const RoomRoute = lazy(() => import("@/pages/RoomRoute").then(module => ({ default: module.RoomRoute })));
const AcademyPage = lazy(() => import("@/pages/AcademyPage").then(module => ({ default: module.AcademyPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then(module => ({ default: module.SettingsPage })));
const AccountPage = lazy(() => import("@/pages/AccountPage").then(module => ({ default: module.AccountPage })));
const DevLogsPage = lazy(() => import("@/pages/DevLogsPage").then(module => ({ default: module.DevLogsPage })));
const AdminPage = lazy(() => import("@/pages/AdminPage").then(module => ({ default: module.AdminPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then(module => ({ default: module.NotFoundPage })));

function RouteLoading() { return <main className="route-loading" role="status" aria-live="polite"><div className="document-loader"><span aria-hidden="true" />Loading the secure workspace…</div></main>; }

export default function App() {
  return <WorkspaceProvider><NotificationProvider><Suspense fallback={<RouteLoading />}><Switch><Route path="/" component={HubPage} /><Route path="/account/:mode?" component={AccountPage} /><Route path="/devlogs" component={DevLogsPage} /><Route path="/admin" component={AdminPage} /><Route path="/studio/:id" component={StudioPage} /><Route path="/r/:roomCode" component={RoomRoute} /><Route path="/room/:roomCode" component={RoomRoute} /><Route path="/academy/:section?" component={AcademyPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFoundPage} /></Switch></Suspense></NotificationProvider></WorkspaceProvider>;
}
