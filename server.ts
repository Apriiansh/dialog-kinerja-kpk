import "dotenv/config";
import { createServer } from "node:http";
import next from "next";

const DIALOG_REMINDER_INTERVAL_MS = 60 * 60 * 1_000;

const port = Number(process.env.PORT ?? 3000);
const dev = process.argv.includes("--dev");
const isVercel = process.env.VERCEL === "1";
const enableWebSocket = !isVercel && process.env.ENABLE_WEBSOCKET !== "false";
const enableReminderJob = !isVercel && process.env.ENABLE_REMINDER_JOB !== "false";

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  let hub: { dispose: () => void } | null = null;
  if (enableWebSocket) {
    void import("./lib/realtime/hub").then(({ setupWebSocketHub }) => {
      hub = setupWebSocketHub({
        server,
        getNextUpgradeHandler: () => app.getUpgradeHandler(),
      });
    });
  }

  server.listen(port, () => {
    console.log(
      `> Ready on http://localhost:${port} (${dev ? "development" : "production"})`,
    );
    console.log(
      `> WebSocket dialog ${enableWebSocket ? "aktif" : "dinonaktifkan"}`,
    );

    if (enableReminderJob) {
      void import("./lib/dialog-reminders")
        .then(({ runDialogReminderJob }) => runDialogReminderJob())
        .catch((err) => {
          console.error("Gagal menjalankan dialog reminder pada startup:", err);
        });
    }
  });

  const reminderTimer = enableReminderJob
    ? setInterval(async () => {
        try {
          const { runDialogReminderJob } = await import("./lib/dialog-reminders");
          await runDialogReminderJob();
        } catch (err) {
          console.error("Gagal menjalankan dialog reminder terjadwal:", err);
        }
      }, DIALOG_REMINDER_INTERVAL_MS)
    : null;
  reminderTimer?.unref();

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (reminderTimer) clearInterval(reminderTimer);
    hub?.dispose();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3_000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});
