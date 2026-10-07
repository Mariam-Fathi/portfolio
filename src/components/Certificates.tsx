"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { COLORS } from "@/components/hero/constants";

type Certificate = {
  id: string;
  title: string;
  /** Optional: certificates without an image show a text placeholder. */
  image?: string;
  /** Intrinsic width of the image (for exact container fit, no layout shift). */
  imageWidth?: number;
  /** Intrinsic height of the image (for exact container fit, no layout shift). */
  imageHeight?: number;
  platform: string;
  link: string;
  skills: string[];
  brief: string;
};

const certificates: Certificate[] = [
  {
    id: "data-engineering",
    title: "Data Engineering",
    image: "/certificates/data-engineering.jpeg",
    imageWidth: 1169,
    imageHeight: 928,
    platform: "DeepLearning.AI & AWS",
    link: "https://www.coursera.org/account/accomplishments/specialization/K9DJQ1VGKWTR",
    skills: ["AWS", "Airflow", "Terraform", "Spark", "dbt", "Data Modeling"],
    brief:
      "Professional certificate (4 courses) with AWS. Built batch and streaming pipelines in graded labs and two capstones: ingestion, orchestration with Airflow, Infrastructure as Code with Terraform and data quality checks. Designed data lakes, warehouses and lakehouses (Glue, Redshift, Iceberg), modelled data with dbt and processed data with Spark.",
  },
  {
    id: "google-advanced-data-analytics",
    title: "Advanced Data Analytics",
    platform: "Google",
    link: "https://www.coursera.org/account/accomplishments/verify/G6B7TQ4Q8U4V",
    skills: ["Python", "Statistics", "Regression", "Machine Learning"],
    brief:
      "Google Advanced Data Analytics Professional Certificate, in progress. Completed: Foundations of Data Science.",
  },
  {
    id: "data-analysis-python",
    title: "Data Analysis with Python",
    platform: "Google",
    link: "https://coursera.org/share/66f2c301ccce9090b0b23039b9407a57",
    skills: ["Python", "pandas", "NumPy", "Jupyter"],
    brief:
      "Introduction to Data Analysis Using Python: cleaning and manipulating data with pandas and NumPy in Jupyter Notebooks.",
  },
  {
    id: "ai-agents",
    title: "AI Agents Intensive",
    image: "/certificates/5-Day AI Agents Intensive Course with Google.png",
    imageWidth: 4800,
    imageHeight: 2960,
    platform: "Kaggle × Google",
    link: "https://www.kaggle.com/certification/badges/mariamfathiamin/105",
    skills: ["Agent Architectures", "Tools & MCP", "Sessions & Memory", "Evaluation", "Google ADK"],
    brief:
      "5-Day AI Agents Intensive Course with Google: agent architectures, tools and MCP, sessions and memory, evaluation and production deployment, with Gemini and Google ADK. My capstone was the Font Selection Agent (see Projects).",
  },
  {
    id: "computer-vision",
    title: "Computer Vision",
    image: "/certificates/Mariam Fathi - Computer Vision.png",
    imageWidth: 4800,
    imageHeight: 2960,
    platform: "Kaggle Learn",
    link: "https://www.kaggle.com/learn/certification/mariamfathiamin/computer-vision",
    skills: ["CNNs", "Data Augmentation", "TensorFlow/Keras"],
    brief: "Convolutional neural networks and data augmentation for image classification with TensorFlow/Keras.",
  },
  {
    id: "time-series",
    title: "Time Series",
    image: "/certificates/Mariam Fathi - Time Series.png",
    imageWidth: 4800,
    imageHeight: 2960,
    platform: "Kaggle Learn",
    link: "https://www.kaggle.com/learn/certification/mariamfathiamin/time-series",
    skills: ["Trend", "Seasonality", "Forecasting", "Hybrid Models"],
    brief: "Trend, seasonality and forecasting with machine learning and hybrid models.",
  },
  {
    id: "ieee",
    title: "IEEE Volunteering",
    image: "/certificates/IEEE Certificate.jpeg",
    imageWidth: 877,
    imageHeight: 620,
    platform: "IEEE Benha University Student Branch",
    link: "https://drive.google.com/file/d/1sMv03TTz0IQSeAaCdvyyKYXt9Jtoi5OS/view",
    skills: ["Event Organisation", "Teamwork"],
    brief:
      "Volunteer on the Events Team (2019–2020), helping organise the branch's technical events and activities.",
  },
];

const FolderIcon = () => (
  <svg width="80" height="80" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <path
      d="M1 3.5a.5.5 0 01.5-.5H5l1.5 2H12.5a.5.5 0 01.5.5V11a.5.5 0 01-.5.5h-11A.5.5 0 011 11V3.5z"
      fill="currentColor"
    />
  </svg>
);

const Certificates: React.FC<{ isActive?: boolean }> = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cert = certificates[selectedIndex];

  useEffect(() => {
    if (!isModalOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isModalOpen]);

  const openModal = (index: number) => {
    setSelectedIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <section
      id="certificates"
      className="relative w-full h-full flex flex-col p-0 font-sans min-h-0"
      style={{ background: COLORS.heroBackground }}
    >
      {/* Icon grid */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-visible py-0 no-visible-scrollbar">
      

        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-4 justify-items-center mt-10">
            {certificates.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openModal(i)}
                className="group cursor-pointer select-none"
                style={{ background: "transparent" }}
                aria-label={`Open certificate: ${c.title}`}
              >
                <div className="flex flex-col items-center">
                  <span
                    className="text-[#e8e0cc]"
                    style={{
                      color: COLORS.accent,
                    }}
                  >
                    <FolderIcon />
                  </span>
                  <span
                    className="mt-1 text-[11px] font-sans leading-relaxed bg-transparent"
                    style={{
                      color: "#280B0B",
                      textAlign: "center",
                      maxWidth: 140,
                      lineHeight: 1.3,
                      textWrap: "balance",
                      overflowWrap: "break-word",
                    }}
                    title={`portfolio / certificates / ${c.title}`}
                  >
                    {c.title}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && cert && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} aria-hidden="true" />

          <div
            className="relative w-[92vw] max-w-[860px] max-h-[86vh] overflow-y-auto border-2 border-[#2a2a2a]"
            style={{ background: COLORS.heroBackground, boxShadow: "2px 2px 0 #1a1a1a" }}
          >
            <div
              className="border-b-2 border-[#2a2a2a] px-4 md:px-5 py-2.5 flex items-center justify-between gap-3"
              style={{ background: COLORS.heroBackground }}
            >
              <span className="text-[11px] leading-relaxed" style={{ color: COLORS.primary, whiteSpace: "nowrap" }}>
                # {cert.title} - {cert.platform}
              </span>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close certificate modal"
                className="flex items-center justify-center rounded-sm border-2 border-[#2a2a2a] px-2 py-1 transition hover:opacity-90"
                style={{ background: COLORS.heroBackground, color: COLORS.primary, boxShadow: "2px 2px 0 #1a1a1a" }}
              >
                ×
              </button>
            </div>

            <div className="px-4 md:px-5 py-4">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: certificate image */}
                <div className="w-full md:max-w-[420px] space-y-2">
                  <CertificateImage cert={cert} />

                  <a
                    href={cert.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border rounded-sm px-2.5 py-1.5 cursor-pointer hover:opacity-90 transition-all duration-150 w-full justify-center"
                    style={{
                      background: COLORS.heroBackground,
                      borderColor: COLORS.accent,
                      boxShadow: `2px 2px 0 ${COLORS.accent}`,
                    }}
                  >
                    <span className="text-[10px] font-sans" style={{ color: COLORS.primary }}>
                      View credential
                    </span>
                    <span className="text-[10px]" style={{ color: COLORS.accent }}>
                      ↗
                    </span>
                  </a>
                </div>

                {/* Right: skills + brief */}
                <div className="flex-1 min-w-0 space-y-4">
                  <div>
                    <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: COLORS.accent }}>
                      Skills
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cert.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center border rounded-sm px-2.5 py-1.5"
                          style={{
                            background: COLORS.heroBackground,
                            borderColor: COLORS.accent,
                            boxShadow: `2px 2px 0 ${COLORS.accent}`,
                            color: COLORS.primary,
                          }}
                        >
                          <span className="text-[10px] font-sans font-bold">{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: COLORS.accent }}>
                      Brief
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: COLORS.primary }}>
                      {cert.brief}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="border-t-2 border-[#2a2a2a] px-4 py-2.5 flex items-center justify-end"
              style={{ background: COLORS.heroBackground }}
            >
              <span className="text-[9px] font-sans" style={{ color: "#8a7a5a" }}>
                {String(selectedIndex + 1).padStart(2, "0")} / {String(certificates.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/** Measured dimensions cache so reopening the same cert uses exact ratio immediately. */
const measuredByCertId: Record<string, { width: number; height: number }> = {};

function CertificateImage({ cert }: { cert: Certificate }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(
    () => measuredByCertId[cert.id] ?? null,
  );

  const dimensions = cert.imageWidth != null && cert.imageHeight != null
    ? { width: cert.imageWidth, height: cert.imageHeight }
    : measured;

  const aspectRatio = dimensions
    ? `${dimensions.width}/${dimensions.height}`
    : "3/2";

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w && h) {
      measuredByCertId[cert.id] = { width: w, height: h };
      setMeasured({ width: w, height: h });
    }
    setImgLoaded(true);
  };

  const imgWidth = dimensions?.width ?? 420;
  const imgHeight = dimensions?.height ?? 280;

  return (
    <a
      href={cert.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#91010F]"
      aria-label={`View ${cert.title} certificate`}
    >
      {cert.image && !imgError ? (
        <span
          className="relative inline-block w-full max-w-[420px] rounded-sm border-2 border-[#2a2a2a] overflow-hidden mx-auto align-top"
          style={{ boxShadow: "3px 3px 0 #1a1a1a", aspectRatio }}
        >
          <Image
            src={encodeURI(cert.image)}
            alt={cert.title}
            width={imgWidth}
            height={imgHeight}
            sizes="(max-width: 768px) 80vw, 420px"
            className={cn(
              "block w-full h-full object-contain object-center transition-opacity duration-300",
              imgLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={handleLoad}
            onError={() => setImgError(true)}
            loading="lazy"
          />
          {!imgLoaded && (
            <span
              className="absolute inset-0 animate-pulse opacity-60"
              style={{ backgroundColor: COLORS.heroBackground }}
              aria-hidden
            />
          )}
        </span>
      ) : (
        <span
          className="block py-6 text-center text-[11px] font-sans font-medium rounded-sm border border-[#2a2a2a]"
          style={{ color: COLORS.primary, background: COLORS.heroBackground }}
        >
          {cert.title}
        </span>
      )}
    </a>
  );
}

export { Certificates };
