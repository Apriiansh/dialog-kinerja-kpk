import "dotenv/config";
import { createServer } from "node:http";
import next from "next";
import { setupWebSocketHub } from "./lib/realtime/hub";
import { runDialogReminderJob } from "./lib/dialog-reminders";

const DIALOG_REMINDER_INTERVAL_MS = 60 * 60 * 1_000;

const port = Number(process.env.PORT ?? 3000);
const dev = process.argv.includes("--dev");

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const hub = setupWebSocketHub({
    server,
    getNextUpgradeHandler: () => app.getUpgradeHandler(),
  });

  server.listen(port, () => {
    console.log(
      `> Ready on http://localhost:${port} (${dev ? "development" : "production"})`,
    );
    console.log(`> WebSocket dialog aktif di ws://localhost:${port}/ws/dialog`);

    runDialogReminderJob().catch((err) => {
      console.error("Gagal menjalankan dialog reminder pada startup:", err);
    });
  });

  const reminderTimer = setInterval(() => {
    runDialogReminderJob().catch((err) => {
      console.error("Gagal menjalankan dialog reminder terjadwal:", err);
    });
  }, DIALOG_REMINDER_INTERVAL_MS);
  reminderTimer.unref();

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(reminderTimer);
    hub.dispose();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3_000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});
