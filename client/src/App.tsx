import { WorkspaceProvider } from "@/app/WorkspaceProvider";
import { Route, Switch } from "wouter";
import { HubPage } from "@/pages/HubPage";
import { StudioPage } from "@/pages/StudioPage";
import { RoomRoute } from "@/pages/RoomRoute";
import { AcademyPage } from "@/pages/AcademyPage";
import { SettingsPage } from "@/pages/SettingsPage";

export default function App() {
  return <WorkspaceProvider><Switch><Route path="/" component={HubPage} /><Route path="/studio/:id" component={StudioPage} /><Route path="/r/:roomCode" component={RoomRoute} /><Route path="/room/:roomCode" component={RoomRoute} /><Route path="/academy/:section?" component={AcademyPage} /><Route path="/settings" component={SettingsPage} /><Route component={HubPage} /></Switch></WorkspaceProvider>;
}
