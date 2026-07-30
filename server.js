// This file acts as the entry point for deployments on mPanel / cPanel Node.js selectors 
// that look for 'server.js' by default.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compiledServerPath = path.join(__dirname, 'dist', 'server.js');

if (!fs.existsSync(compiledServerPath)) {
  console.log("===============================================================");
  console.log("[INFO] Missing 'dist/server.js'");
  console.log("[INFO] Auto-building the application now. This may take a minute...");
  try {
    // Run the build process synchronously so Passenger waits for it
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log("[INFO] Build completed successfully.");
    console.log("===============================================================");
  } catch (error) {
    console.error("===============================================================");
    console.error("[ERROR] Auto-build failed!");
    console.error("Please log into mPanel, go to your Node.js app, and run the NPM script 'build'.");
    console.error("Error details:", error.message);
    console.error("===============================================================");
    process.exit(1);
  }
}

// Load the compiled server
import('./dist/server.js').catch(err => {
    console.error("Failed to load the compiled server:", err);
});
