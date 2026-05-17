const cors = require("cors");
const express = require("express");

const taalBulletinsRouter = require("./routes/taalBulletins.routes");

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(
  cors({
    origin: true
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/bulletins/taal", taalBulletinsRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode >= 500 ? "The bulletin service is temporarily unavailable." : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({ error: message });
});

app.listen(port, () => {
  console.log(`VOLT bulletin backend listening on http://0.0.0.0:${port}`);
});

