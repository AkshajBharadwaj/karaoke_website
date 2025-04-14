import { useState } from "react";
import "./App.css";

function App() {
  const [pitchFile, setPitchFile] = useState(null);
  const [pitchValue, setPitchValue] = useState(0);
  const [pitchLoading, setPitchLoading] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [karaokeUrl, setKaraokeUrl] = useState("");
  const [karaokeLoading, setKaraokeLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPitchFile(file);
    }
  };

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    setPitchValue(value);
  };

  const handlePitchSubmit = async () => {
    if (!pitchFile) {
      alert("Please upload a file first.");
      return;
    }

    setPitchLoading(true);
    const formData = new FormData();
    formData.append("audio", pitchFile);
    formData.append("semitones", pitchValue);

    try {
      const response = await fetch("http://localhost:3000/pitch", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Pitch shift failed");
      }

      const blob = await response.blob();
      const audioURL = URL.createObjectURL(blob);
      setAudioURL(audioURL);
      setSuccessMessage("Pitch shift successful!");
    } catch (error) {
      alert(error.message);
    } finally {
      setPitchLoading(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleKaraokeify = async (e) => {
    e.preventDefault();
    if (!karaokeUrl.trim()) {
      alert("Please enter a YouTube URL.");
      return;
    }
    setKaraokeLoading(true);
    try {
      const response = await fetch("http://localhost:3000/karaokeify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: karaokeUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process karaokeify");
      }

      const blob = await response.blob();
      const downloadURL = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadURL;
      a.download = "stems.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert(error.message);
    } finally {
      setKaraokeLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="content" id="karaokeify">
        <h1>One-Click Karaokeify</h1>
        <form onSubmit={handleKaraokeify}>
          <p>Enter YouTube URL:</p>
          <input
            type="text"
            value={karaokeUrl}
            onChange={(e) => setKaraokeUrl(e.target.value)}
            placeholder="Paste YouTube URL"
          />
          <button type="submit" disabled={karaokeLoading}>
            {karaokeLoading ? "Downloading..." : "Karaokeify!"}
          </button>
        </form>
      </div>

      <div className="content" id="livePitch">
        <h1>Pitch Shift</h1>
        <input
          type="file"
          accept="audio/mpeg"
          onChange={handleFileChange}
        />
        <input
          type="range"
          min="-6"
          max="6"
          step="1"
          value={pitchValue}
          onChange={handleSliderChange}
        />
        <label>{pitchValue} semitones</label>
        <button onClick={handlePitchSubmit} disabled={pitchLoading}>
          {pitchLoading ? "Processing..." : "Apply Pitch"}
        </button>
        {audioURL && (
          <audio controls src={audioURL} />
        )}
        {successMessage && <div className="success">{successMessage}</div>}
      </div>
    </div>
  );
}

export default App;
