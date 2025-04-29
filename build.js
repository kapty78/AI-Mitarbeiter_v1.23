const { execSync } = require('child_process');

console.log("Starting build process...");

try {
  console.log("Running Next.js build...");
  execSync('npx next build', { stdio: 'inherit' });
  console.log("Build completed successfully!");
} catch (error) {
  console.error("Build failed:", error.message);
  process.exit(1);
} 