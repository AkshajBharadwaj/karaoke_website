const express = require("express");
const cors = require("cors");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const { exec } = require("child_process"); // Added for Docker
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
  const inputFile = path.join(tmpDir, "input.mp3");
  const outputDir = path.join(tmpDir, "output");

  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // Download audio from YouTube using yt-dlp
    const downloadCmd = `/usr/local/bin/yt-dlp --ffmpeg-location /usr/bin/ffmpeg -f bestaudio -x --audio-format mp3 -o "${inputFile}" "${url}"`;
    exec(downloadCmd, async (error) => {
      if (error) {
        console.error("YouTube download error:", error);
        return res.status(500).json({ error: "Failed to download YouTube audio" });
      }

      // Run Demucs
      const demucsCmd = `demucs -d cpu -n htdemucs_6s --two-stems=vocals --mp3 ...`;
      exec(demucsCmd, async (error, stdout, stderr) => {
        if (error) {
          console.error("Demucs error:", error);
          return res.status(500).json({ error: "Audio separation failed" });
        }

        const modelSubfolder = fs.readdirSync(outputDir).find((f) =>
          fs.lstatSync(path.join(outputDir, f)).isDirectory()
        );
        const innerFolder = fs.readdirSync(path.join(outputDir, modelSubfolder)).find((f) =>
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
          res.download(zipPath, "stems.zip", () => {
            fs.rmSync(tmpDir, { recursive: true, force: true });
          });
        });
      });
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to karaokeify" });
  }
});

app.post("/download", upload.none(), (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  const outputPath = path.join(__dirname, `video_${Date.now()}.mp4`);
  const command = `yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" -o "${outputPath}" "${url}"`;

  exec(command, (error, stdout, stderr) => {
    console.log("YTDLP STDOUT:", stdout);
    console.error("YTDLP STDERR:", stderr);

    if (error) {
      console.error("Download error:", error);
      return res.status(500).json({ error: "Failed to download video" });
    }

    res.download(outputPath, "video.mp4", () => {
      fs.unlinkSync(outputPath); // Clean up
    });
  });
});


app.post("/convert", upload.single("video"), (req, res) => {
  const filePath = req.file.path;
  res.header("Content-Disposition", 'attachment; filename="audio.mp3"');

  ffmpeg(filePath)
    .audioCodec("libmp3lame")
    .format("mp3")
    .on("error", (err) => {
      console.error("Error converting video:", err);
      res.status(500).json({ error: "Failed to convert video" });
    })
    .on("end", () => {
      // Optionally delete the uploaded file after conversion
      // fs.unlinkSync(filePath);
    })
    .pipe(res, { end: true });
});
app.post("/pitch", upload.single("audio"), (req, res) => {
  const filePath = req.file.path;
  const semitones = parseFloat(req.body.semitones);

  if (isNaN(semitones)) {
    return res.status(400).json({ error: "Invalid semitone value" });
  }

  const outputFile = `${filePath}_pitched.mp3`;
  const pitchFactor = Math.pow(2, semitones / 12); // Convert semitones to rate multiplier

  ffmpeg(filePath)
    .audioFilter(`asetrate=44100*${pitchFactor},atempo=${1 / pitchFactor}`)
    .audioCodec("libmp3lame")
    .format("mp3")
    .on("error", (err) => {
      console.error("Error changing pitch:", err);
      res.status(500).json({ error: "Pitch shift failed" });
    })
    .on("end", () => {
      res.download(outputFile, "pitched.mp3", () => {
        fs.unlinkSync(filePath);
        fs.unlinkSync(outputFile);
      });
    })
    .save(outputFile);
});

app.post("/split", upload.single("audio"), async (req, res) => {
  const inputFile = req.file.path;
  const outputDir = path.join(__dirname, `output_${Date.now()}`);
  const envPathToDemucs = "/opt/anaconda3/envs/demucs/bin/demucs"; // Update this if your demucs path is different

  try {
    fs.mkdirSync(outputDir, { recursive: true });

    const command = `${envPathToDemucs} -d cpu -n htdemucs_6s --two-stems=vocals --mp3 "${inputFile}" --out "${outputDir}"`;

    exec(command, async (error, stdout, stderr) => {
      console.log("DEMUCS STDOUT:", stdout);
      console.error("DEMUCS STDERR:", stderr);

      if (error) {
        console.error("Demucs error:", error);
        return res.status(500).json({ error: "Failed to split audio" });
      }

      // Find the output subfolder (e.g. htdemucs_6s/audio (3))
      const modelSubfolder = fs
        .readdirSync(outputDir)
        .find((f) => fs.lstatSync(path.join(outputDir, f)).isDirectory());
      if (!modelSubfolder) {
        return res.status(500).json({ error: "No output folder from Demucs" });
      }

      const demucsOutput = path.join(outputDir, modelSubfolder);
      const audioSubfolder = fs
        .readdirSync(demucsOutput)
        .find((f) => fs.lstatSync(path.join(demucsOutput, f)).isDirectory());
      if (!audioSubfolder) {
        return res.status(500).json({ error: "No audio folder inside Demucs output" });
      }

      const fullOutputPath = path.join(demucsOutput, audioSubfolder);

      // Zip the stems
      const zipPath = path.join(outputDir, "stems.zip");
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        res.download(zipPath, "stems.zip", () => {
          // Cleanup
          fs.rmSync(outputDir, { recursive: true, force: true });
          fs.unlinkSync(inputFile);
        });
      });

      archive.on("error", (err) => {
        throw err;
      });

      archive.pipe(output);
      archive.directory(fullOutputPath, false);
      archive.finalize();
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to process audio" });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
