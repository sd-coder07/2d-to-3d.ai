"use client";

import React, { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import UploadZone from "@/components/UploadZone";
import LoadingOverlay from "@/components/LoadingOverlay";
import DownloadPanel from "@/components/DownloadPanel";
import { optimizeImageFor3D } from "@/utils/imageOptimizer";

// Dynamically import Three.js 3D Hero Canvas and Model Viewer
const Hero3DCanvas = dynamic(() => import("@/components/Hero3DCanvas"), {
  ssr: false,
});

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="viewer-ssr-placeholder">
      <div className="loading-ring" style={{ width: 32, height: 32, borderWidth: 2 }} />
      <span>Initializing 3D Viewport…</span>
    </div>
  ),
});

type AppState = "idle" | "generating" | "result" | "error";

interface ModelConfig {
  key: string;
  name: string;
  desc: string;
  badge: string;
  speed: string;
}

const MODELS: ModelConfig[] = [
  { key: "triposr", name: "TripoSR", desc: "Ultra Fast • Auto-Failover Pool", badge: "Recommended", speed: "~5s" },
  { key: "instantmesh", name: "InstantMesh", desc: "Multi-View • High Detail Geometry", badge: "High Detail", speed: "~15s" },
  { key: "image-to-3d", name: "Image-to-3D", desc: "Fast Shape Generator • UV Maps", badge: "Fast Shape", speed: "~10s" },
];

function renderFormattedError(msg: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(msg)) !== null) {
    if (match.index > lastIndex) {
      parts.push(msg.substring(lastIndex, match.index));
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#38bdf8", textDecoration: "underline", fontWeight: 600, margin: "0 4px" }}
      >
        {match[1]}
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < msg.length) {
    parts.push(msg.substring(lastIndex));
  }

  return parts.length > 0 ? parts : msg;
}

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("triposr");
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [retryAfter, setRetryAfter] = useState<number>(0);
  const [networkError, setNetworkError] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Optimizing image & connecting to AI Engine…");
  const [queueInfo, setQueueInfo] = useState<{ position: number; step: string; eta?: number | null } | null>(null);

  const generatorRef = useRef<HTMLDivElement>(null);
  const glbBlobRef = useRef<Blob | null>(null);

  const handleImageSelect = useCallback((file: File, url: string) => {
    setImageFile(file);
    setPreviewUrl(url);
    setAppState("idle");
    setErrorMsg("");
    setNetworkError(false);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setAppState("idle");
    setErrorMsg("");
    setNetworkError(false);
  }, [previewUrl]);

  const scrollToGenerator = () => {
    generatorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGenerate = useCallback(async () => {
    if (!imageFile) return;

    setAppState("generating");
    setErrorMsg("");
    setNetworkError(false);
    setRetryAfter(0);
    setLoadingMessage("Optimizing image resolution & connecting to AI Engine…");
    setQueueInfo(null);

    try {
      // 1. Client-side Image Optimization
      const optimizedFile = await optimizeImageFor3D(imageFile);

      const form = new FormData();
      form.append("image", optimizedFile);
      form.append("model", selectedModel);

      const response = await fetch("/api/generate-3d", { method: "POST", body: form });

      if (!response.body) throw new Error("No response stream from server.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event: Record<string, unknown>;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          switch (event.type) {
            case "status":
              setLoadingMessage((event.message as string) ?? "");
              break;

            case "queue":
              setQueueInfo({
                position: event.position as number,
                step: event.step as string,
                eta: (event.eta as number | null | undefined) ?? null,
              });
              setLoadingMessage((event.message as string) ?? "");
              break;

            case "done": {
              const b64 = event.modelData as string;
              const bin = atob(b64);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              const blob = new Blob([bytes], { type: "model/gltf-binary" });
              if (glbUrl) URL.revokeObjectURL(glbUrl);
              const newGlbUrl = URL.createObjectURL(blob);
              setGlbUrl(newGlbUrl);
              setModelUsed((event.modelUsed as string) ?? "");
              setQueueInfo(null);
              setAppState("result");
              break;
            }

            case "error":
              setRetryAfter((event.retryAfter as number) ?? 0);
              if (event.networkError) setNetworkError(true);
              throw new Error((event.message as string) ?? "Unknown error.");
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error.";
      setErrorMsg((prev) => prev || msg);
      setAppState((prev) => prev === "result" ? "result" : "error");
    }
  }, [imageFile, selectedModel, glbUrl]);

  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (glbUrl) URL.revokeObjectURL(glbUrl);
    setImageFile(null);
    setPreviewUrl(null);
    setGlbUrl(null);
    setAppState("idle");
    setErrorMsg("");
    setRetryAfter(0);
    setNetworkError(false);
    setLoadingMessage("Connecting to AI Engine…");
    setQueueInfo(null);
    glbBlobRef.current = null;
  }, [previewUrl, glbUrl]);

  const selectedModelLabel =
    MODELS.find((m) => m.key === selectedModel)?.name ?? selectedModel;

  const needsToken = errorMsg.toLowerCase().includes("token");

  return (
    <div className="emerald-theme-layout">
      {/* ── Header Navbar ── */}
      <header className="scope-header">
        <div className="header-container">
          {/* Logo Left */}
          <a href="/" className="scope-logo" aria-label="3DGen AI Home">
            <img
              src="/logo-light.png"
              alt="3DGen AI Logo"
              className="scope-logo-img"
            />
          </a>

          {/* Navigation Links Center */}
          <nav className="scope-nav">
            <a href="#" className="nav-link active">Home</a>
            <a href="#generator-section" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToGenerator(); }}>Generator</a>
            <a href="#models-section" className="nav-link">AI Models</a>
            <a href="#features-section" className="nav-link">Features</a>
            <a href="#rewards-section" className="nav-link">Formats</a>
          </nav>

          {/* Action Button Right */}
          <div className="header-actions">
            <button className="pill-btn-white" onClick={scrollToGenerator}>
              <span>Try For Free</span>
              <span className="pill-arrow-icon">→</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Hero Section ── */}
      <section className="scope-hero-section">
        {/* Background 3D Torus Sculptural Canvas */}
        <Hero3DCanvas />

        <div className="hero-content-grid">
          {/* Left Column: Big Headlines & CTA */}
          <div className="hero-left-col">
            <h1 className="hero-giant-title">
              <span className="title-row">Free 2D</span>
              <span className="title-row">to 3D AI</span>
            </h1>

            <p className="hero-scope-subtitle">
              Generate a free 3D model from any 2D image in seconds. Upload a JPG, PNG, or WEBP photo and our AI instantly reconstructs a textured GLB mesh — no signup, no cost.
            </p>

            <div className="hero-cta-wrap">
              <button className="pill-btn-white hero-main-btn" onClick={scrollToGenerator}>
                <span>Try For Free</span>
              </button>
            </div>

            {/* Bottom Left Info Rows */}
            <div className="hero-info-rows">
              <a href="#generator-section" className="info-row-item" onClick={(e) => { e.preventDefault(); scrollToGenerator(); }}>
                <span>How to work with our AI generator</span>
                <span className="row-arrow">↗</span>
              </a>
              <a href="#features-section" className="info-row-item">
                <span>Supported 3D formats (GLB / glTF 2.0)</span>
                <span className="row-arrow">↗</span>
              </a>
            </div>
          </div>

          {/* Right Column: Social Links & Work Preview Card */}
          <div className="hero-right-col">
            <div className="social-follow-box">
              <span className="social-label">Follow us on social networks</span>
              <div className="social-icons">
                <a href="#" className="social-icon-pill" aria-label="Facebook">f</a>
                <a href="#" className="social-icon-pill" aria-label="Discord">👾</a>
                <a href="#" className="social-icon-pill" aria-label="Instagram">📷</a>
                <a href="#" className="social-icon-pill" aria-label="X">𝕏</a>
              </div>
            </div>

            {/* Bottom Right Floating Preview Card */}
            <div className="hero-work-card" onClick={scrollToGenerator} role="button" tabIndex={0}>
              <div className="card-image-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/sample_3d_work.png"
                  alt="3D Model Sample Render"
                  className="card-3d-render-img"
                />
                <button className="card-arrow-circle" aria-label="View sample works">↗</button>
              </div>
              <p className="card-title">View sample works</p>
            </div>
          </div>

          {/* Giant Bottom Headline Right */}
          <div className="hero-bottom-right-title">
            <span className="title-row">With Us</span>
          </div>
        </div>
      </section>

      {/* ── Loading Overlay ── */}
      {appState === "generating" && (
        <LoadingOverlay
          modelName={selectedModelLabel}
          message={loadingMessage}
          queueInfo={queueInfo}
        />
      )}

      {/* ── Generator & Upload Section ── */}
      {(appState === "idle" || appState === "error") && (
        <main className="upload-section-wrap" id="generator-section" ref={generatorRef}>
          <div className="emerald-panel-card">
            <div className="panel-header">
              <span className="panel-tag">FREE 2D IMAGE TO 3D MODEL GENERATOR</span>
              <h2 className="panel-title">Upload Your Photo &amp; Generate a Free 3D Model</h2>
            </div>

            {/* Upload Zone */}
            <UploadZone
              onImageSelect={handleImageSelect}
              previewUrl={previewUrl}
              onRemove={handleRemoveImage}
            />

            {/* Model Selector */}
            <div id="models-section" className="model-selector-container">
              <div className="model-selector-header">
                <span className="selector-title">Select AI Model</span>
                <span className="selector-subtitle">High Speed Auto-Failover Pools</span>
              </div>

              <div className="model-select-wrap" role="radiogroup" aria-label="AI model selection">
                {MODELS.map((m) => (
                  <button
                    key={m.key}
                    id={`model-${m.key}`}
                    role="radio"
                    aria-checked={selectedModel === m.key}
                    className={`model-chip ${selectedModel === m.key ? "selected" : ""}`}
                    onClick={() => setSelectedModel(m.key)}
                  >
                    <div className="model-chip-top">
                      <span className="model-chip-name">{m.name}</span>
                      <span className="model-chip-speed">{m.speed}</span>
                    </div>
                    <div className="model-chip-desc">{m.desc}</div>
                    {selectedModel === m.key && (
                      <div className="model-chip-badge">✓ {m.badge}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Card with Formatted Links & Fast Action */}
            {appState === "error" && errorMsg && (
              <div className="error-card" role="alert">
                <div className="error-icon" aria-hidden="true">
                  {networkError ? "🌐" : "⚠️"}
                </div>
                <div className="error-content">
                  <p className="error-title">
                    {networkError ? "Network Connection Error" : "Generation Alert"}
                  </p>
                  <p className="error-msg">{renderFormattedError(errorMsg)}</p>

                  {retryAfter > 0 && (
                    <p className="retry-hint">
                      Please wait {retryAfter}s and try again (Space initializing)
                    </p>
                  )}
                  {needsToken && (
                    <div className="token-warning">
                      <span>🔑 Add your free HuggingFace token in <code>.env.local</code> as <code>HF_TOKEN=hf_…</code></span>
                      <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">Get Free Token →</a>
                    </div>
                  )}

                  <div style={{ marginTop: "0.75rem" }}>
                    <button
                      className="pill-btn-white"
                      style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
                      onClick={handleGenerate}
                    >
                      ⚡ Retry Fast Mode
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Pill CTA Button */}
            <div className="generate-btn-wrap">
              <button
                id="generate-btn"
                className={`pill-btn-white generate-main-btn ${imageFile ? "active" : ""}`}
                onClick={handleGenerate}
                disabled={!imageFile}
                aria-label="Generate 3D model from uploaded image"
              >
                <span>{imageFile ? `Generate 3D Model with ${selectedModelLabel}` : "Upload an Image First"}</span>
                <span className="pill-arrow-icon">↓</span>
              </button>
            </div>
          </div>

          {/* Features Section */}
          <section className="features-grid" id="features-section" aria-label="Key Capabilities of Free 2D to 3D Model Generator">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Instant 2D to 3D Reconstruction</h3>
              <p className="feature-desc">Convert any single 2D image into a fully textured 3D mesh in seconds. Powered by neural radiance fields and implicit shape AI networks — no 3D expertise needed.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3 className="feature-title">Free PBR Textures &amp; UV Maps</h3>
              <p className="feature-desc">Automatically generates UV unwrapping and extracts high-fidelity vertex color &amp; PBR surface material maps. Download your textured 3D model for free with no watermarks.</p>
            </div>
            <div className="feature-card" id="rewards-section">
              <div className="feature-icon">🎮</div>
              <h3 className="feature-title">GLB / glTF 2.0 — Universal Format</h3>
              <p className="feature-desc">Exports industry-standard GLB (glTF 2.0) files ready to import into Blender, Unity 3D, Unreal Engine 5, Three.js, &amp; any WebGL viewer.</p>
            </div>
          </section>

          {/* About / SEO Content Section */}
          <section className="features-grid" aria-label="About Free 2D Image to 3D Model Generator" style={{ marginTop: "0" }}>
            <div className="feature-card" style={{ gridColumn: "1 / -1" }}>
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">How Our Free AI 3D Model Generator Works</h3>
              <p className="feature-desc" style={{ maxWidth: "720px", lineHeight: "1.7" }}>
                3DGen AI uses state-of-the-art open-source AI models — <strong>TripoSR</strong>, <strong>InstantMesh</strong>, and <strong>Image-to-3D</strong> — hosted on Hugging Face ZeroGPU to
                convert your 2D photo into a 3D model instantly, completely free. Simply upload a JPG, PNG, or WEBP image (up to 10 MB), pick your preferred AI engine,
                and download a ready-to-use GLB file within seconds. No account, no watermark, no cost — just free 2D image to 3D model generation.
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="features-grid" id="faq-section" aria-label="Frequently Asked Questions" style={{ marginTop: "0" }}>
            <div className="feature-card" style={{ gridColumn: "1 / -1" }}>
              <div className="feature-icon">❓</div>
              <h2 className="feature-title" style={{ fontSize: "1.1rem" }}>Frequently Asked Questions</h2>
            </div>
            <div className="feature-card">
              <h3 className="feature-title" style={{ fontSize: "0.95rem" }}>How do I convert a 2D image to a 3D model for free?</h3>
              <p className="feature-desc">Upload your JPG, PNG, or WEBP image, choose an AI model (TripoSR is fastest at ~5 s), and click Generate. Your free GLB 3D model downloads instantly — no account required.</p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title" style={{ fontSize: "0.95rem" }}>Is this 3D model generator really free?</h3>
              <p className="feature-desc">Yes — 100% free. Powered by Hugging Face ZeroGPU and open-source AI. No signup, no credit card, no hidden fees, no watermarks on your exported GLB files.</p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title" style={{ fontSize: "0.95rem" }}>What images work best for 2D to 3D conversion?</h3>
              <p className="feature-desc">Single-subject images on a clean background produce the best 3D models — characters, weapons, vehicles, furniture, statues, and product photos. Supported: JPG, PNG, WEBP up to 10 MB.</p>
            </div>
          </section>
        </main>
      )}

      {/* ── Result Section ── */}
      {appState === "result" && glbUrl && (
        <main className="result-section" id="main-content">
          {/* 3D Viewer */}
          <section className="viewer-wrap" aria-label="3D model viewer">
            <div className="viewer-topbar">
              <span className="viewer-title">
                <span className="viewer-live-dot" aria-hidden="true" />
                3D Interactive Viewport — {selectedModelLabel}
              </span>
              <span className="viewer-controls-hint">
                Orbit: Left Drag · Zoom: Scroll · Pan: Right Drag
              </span>
            </div>
            <ModelViewer glbUrl={glbUrl} />
          </section>

          {/* Info + Downloads */}
          <DownloadPanel
            glbUrl={glbUrl}
            modelUsed={modelUsed}
            onReset={handleReset}
          />
        </main>
      )}

      {/* ── Footer ── */}
      <footer className="scope-footer">
        <div className="footer-container">
          <p className="footer-text">
            Free 2D Image to 3D Model Generator · Powered by{" "}
            <a href="https://huggingface.co" className="footer-link" target="_blank" rel="noopener noreferrer">Hugging Face ZeroGPU</a>
            {" "}·{" "}
            <a href="https://threejs.org" className="footer-link" target="_blank" rel="noopener noreferrer">Three.js WebGL</a>
            {" "}· Open-Source AI Models (TripoSR · InstantMesh · Image-to-3D)
          </p>
          <p className="footer-subtext">
            © 2026 3DGen AI — All rights reserved. Convert 2D photos to free GLB 3D models via neural AI reconstruction.
          </p>
        </div>
      </footer>
    </div>
  );
}
