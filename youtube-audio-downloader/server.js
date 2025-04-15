const express = require("express");
const cors = require("cors");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const { exec } = require("child_process");

const app = express();
const port = 3000;

ffmpeg.setFfmpegPath(ffmpegPath);

const upload = multer({ dest: "uploads/" });

app.use(
  cors({
    origin: ["http://localhost:3001", "https://karaoke-website.vercel.app"],
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the YouTube Video Downloader API");
});

app.post("/karaokeify", async (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  const tmpDir = path.join(__dirname, `karaoke_${Date.now()}`);
  const outputDir = path.join(tmpDir, "output");

  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const command = `youtube-dl "${url}" --output "${path.join(tmpDir, 'input.%(ext)s')}" --extract-audio --audio-format mp3`;

  console.log("⏬ Running youtube-dl command...");

  exec(command, { shell: true }, (error, stdout, stderr) => {
    console.log("youtube-dl stdout:", stdout);
    console.error("youtube-dl stderr:", stderr);

    if (error) {
      console.error("❌ youtube-dl error:", error);
      return res.status(500).json({ error: "Failed to download audio from YouTube" });
    }

    const downloadedFile = fs.readdirSync(tmpDir).find(f =>
      f.startsWith("input.") && !f.endsWith(".part")
    );
    if (!downloadedFile) {
      return res.status(500).json({ error: "No audio file found after download" });
    }

    const fullInputPath = path.join(tmpDir, downloadedFile);
    const demucsCmd = `demucs -d cpu -n htdemucs_6s --two-stems=vocals --mp3 "${fullInputPath}" --out "${outputDir}"`;

    console.log("🎛️ Running Demucs command:", demucsCmd);

    exec(demucsCmd, async (error, stdout, stderr) => {
      console.log("Demucs stdout:", stdout);
      console.error("Demucs stderr:", stderr);

      if (error) {
        console.error("❌ Demucs error:", error);
        return res.status(500).json({ error: "Audio separation failed" });
      }

      const modelSubfolder = fs.readdirSync(outputDir).find(f =>
        fs.lstatSync(path.join(outputDir, f)).isDirectory()
      );
      const innerFolder = fs.readdirSync(path.join(outputDir, modelSubfolder)).find(f =>
        fs.lstatSync(path.join(outputDir, modelSubfolder, f)).isDirectory()
      );

      const fullPath = path.join(outputDir, modelSubfolder, innerFolder);
      const zipPath = path.join(tmpDir, "stems.zip");

      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.pipe(output);
      archive.directory(fullPath, false);
      archive.finalize();

      output.on("close", () => {
        console.log("✅ Sending zip file:", zipPath);
        res.download(zipPath, "stems.zip", () => {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        });
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
