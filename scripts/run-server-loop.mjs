import { spawn } from "node:child_process";

function start() {
  const child = spawn(process.execPath, ["--experimental-strip-types", "server/index.ts"], {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    console.warn(`[OMB Server Loop] server exited with code ${code}, signal ${signal}. Restarting in 1000ms...`);
    setTimeout(start, 1000);
  });
}

start();
