const express = require("express");
const cors = require("cors");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const { exec } = require("child_process");
const axios = require("axios");

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
  res.send("Welcome to the YouTube Audio Splitter API");
});

app.post("/karaokeify", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  const tmpDir = path.join(__dirname, `karaoke_${Date.now()}`);
  const outputDir = path.join(tmpDir, "output");

  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const mp3Path = path.join(tmpDir, "input.mp3");

  console.log("🎵 Downloading YouTube audio via third-party API...");

  try {
    const response = await axios({
      method: "GET",
      url: "https://youtube-download-api.matheusishiyama.repl.co/mp3/",
      params: { url },
      responseType: "stream",
    });

    const writer = fs.createWriteStream(mp3Path);
    response.data.pipe(writer);

    writer.on("finish", () => {
      console.log("✅ Audio downloaded, running Demucs...");

      const demucsCmd = `demucs -d cpu -n htdemucs_6s --two-stems=vocals --mp3 "${mp3Path}" --out "${outputDir}"`;

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

    writer.on("error", (err) => {
      console.error("❌ Error writing MP3 file:", err);
      res.status(500).json({ error: "Failed to write MP3 file" });
    });
  } catch (err) {
    console.error("❌ Error downloading MP3:", err);
    res.status(500).json({ error: "Failed to download MP3" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
