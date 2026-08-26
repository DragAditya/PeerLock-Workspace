import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "@/lib/trpc";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import "./styles/audit-surfaces.css";
import "./styles/second-pass-account.css";
import "./styles/second-pass-studio.css";
import "./styles/theme-refinement.css";
import "./components/peer-command-palette.css";

const queryClient = new QueryClient();
const client = trpc.createClient({ links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })] });
createRoot(document.getElementById("root")!).render(<trpc.Provider client={client} queryClient={queryClient}><QueryClientProvider client={queryClient}><App /></QueryClientProvider></trpc.Provider>);
