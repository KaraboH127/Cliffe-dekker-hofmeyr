// Sanity browser client setup for the static site.
// This uses ESM over CDN so it works directly with live-server.
import { createClient } from "https://esm.sh/@sanity/client@7?bundle";

const client = createClient({
  projectId: "8fgmk0xd",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

export default client;
export { client };
