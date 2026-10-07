"use client";
import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { COLORS } from "@/components/hero/constants";

type ProjectLink = {
  name: string;
  url: string;
  isGrouped?: boolean;
  groupedLinks?: Array<{ name: string; url: string }>;
};

type Project = {
  id: string;
  title: string;
  role: string;
  description: string;
  links: ProjectLink[];
};

const extColors: Record<string, string> = {
  link: "#6A0610",
};

const FolderIcon = ({ open }: { open: boolean }) => (
  <svg width="80" height="80" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <path
      d={open ? "M1 4h12v7.5a.5.5 0 01-.5.5H1.5a.5.5 0 01-.5-.5V4zm0 0V2.5a.5.5 0 01.5-.5H5l1.5 2H1z" : "M1 3.5a.5.5 0 01.5-.5H5l1.5 2H12.5a.5.5 0 01.5.5V11a.5.5 0 01-.5.5h-11A.5.5 0 011 11V3.5z"}
      fill="currentColor"
    />
  </svg>
);

const FileIcon = ({ ext }: { ext?: string }) => (
  <svg width="12" height="14" viewBox="0 0 12 14" fill="none" className="flex-shrink-0">
    <path d="M1 1.5A.5.5 0 011.5 1H8l3 3v8.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V1.5z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="0.8" />
    <path d="M8 1v3h3" stroke="currentColor" strokeWidth="0.8" />
    <text x="2" y="10" fontSize="3.5" fill="currentColor" style={{ fontFamily: "var(--font-default)" }} fontWeight="bold">
      {ext?.toUpperCase().slice(0, 3) ?? "LNK"}
    </text>
  </svg>
);

const projects: Project[] = [
  {
    id: "personality-analysis",
    title: "Personality Analysis",
    role: "Graduation Project (Grade: Excellent)",
    description:
      "A multimodal deep learning system that predicts a job candidate's Big Five personality traits from a 15-second interview video, built in a team of 6 on the ChaLearn First Impressions V2 benchmark (CVPR 2017, 10,000 videos). My parts were the emotion-based video model and the multimodal fusion. I designed an unsupervised video summarization pipeline (Haar Cascade, VGG-Face embeddings, K-means with silhouette analysis) to keep only representative key frames. I built emotion features with DeepFace, diagnosed an imbalanced-regression problem (85% of labels between 0.3 and 0.7) and oversampled rare label ranges in the training data, cutting the model's MAE from 0.112 to 0.061. I benchmarked XGBoost, an RBF network and TabNet with 4-fold cross-validation and Optuna, and stacked the best two with an SVR meta-learner. Finally, I built the late-fusion stage: per-trait models over the video, audio and text predictions, comparing linear SVR, Random Forest and XGBoost, with XGBoost giving the system's final MAE of 0.127 across the five traits.",
    links: [
      { name: "Thesis", url: "https://drive.google.com/file/d/1YwWHlXiXh3pCK1MlZxDT9HE5RtQQfu_C/view" },
      { name: "GitHub", url: "https://github.com/Mariam-Fathi/multimodal-personality-analysis" },
    ],
  },
  {
    id: "homi",
    title: "Homi",
    role: "Product Analytics & Experimentation Case Study",
    description:
      "A real-estate app I rebuilt end to end to answer three product questions with my own data pipeline, statistics and models. Every analysis was checked against simulated users with known, planted effects. Full stack: a React Native app, a FastAPI and PostgreSQL backend, and event tracking (a 21-event tracking plan, offline-safe client and server-side outcome recording), covered by 158 automated tests in CI. Funnel analytics: a SQL data model and a Streamlit dashboard, where a per-stage segment diagnosis recovered every planted problem across six random seeds. A/B testing: a pre-registered experiment with power analysis and simulation-checked error rates (4.7% false positives, 79.5% power); formatting the phone field raised viewing requests by 9.1 points (95% CI +2.7 to +15.6). Recommender: five models compared offline (NDCG, bootstrap confidence intervals) and in a three-arm online test, where the best offline model cut recommendation opens by 43%, showing why offline metrics alone can mislead.",
    links: [
      { name: "GitHub", url: "https://github.com/Mariam-Fathi/homi" },
      { name: "Project summary", url: "https://github.com/Mariam-Fathi/homi/blob/master/docs/summary.md" },
      { name: "Google Play (v1)", url: "https://play.google.com/store/apps/details?id=com.mariamfathi.homi" },
    ],
  },
  {
    id: "smart-key",
    title: "Smart Key",
    role: "Software Engineer at Tarqia",
    description:
      "An IoT hotel access platform. I led development of the admin web portal: room access control, hotel hierarchy, housekeeping schedules, inventory import and role-based permissions. I created the housekeeping staff mobile app for room status tracking and unlocking, and engineered a desktop bridge between the portal and an NFC card encoder, so staff can write key cards from the browser.",
    links: [
      { name: "Housekeeping app – Google Play", url: "https://play.google.com/store/apps/details?id=com.housekeepingapp" },
      { name: "Housekeeping app – App Store", url: "https://apps.apple.com/us/app/housekeepinglbr/id6755960728" },
    ],
  },
  {
    id: "smart-wheelchair",
    title: "Smart Wheelchair",
    role: "Software Engineer at Tarqia",
    description:
      "An IoT wheelchair rental system. I delivered the trip flow of the guest mobile app (maps, QR check-in and live trip tracking) and the handover check in the staff app, and set up the admin web app with a reusable entity-management page shared across list pages.",
    links: [
      { name: "Guest app – Google Play", url: "https://play.google.com/store/apps/details?id=com.wheelchairuser" },
      { name: "Staff app – Google Play", url: "https://play.google.com/store/apps/details?id=com.wheelchairstaff" },
      { name: "Staff app – App Store", url: "https://apps.apple.com/us/app/efadgo-staff/id6760079644" },
    ],
  },
  {
    id: "fire-crm",
    title: "Fire CRM",
    role: "Frontend Engineer (Freelance)",
    description:
      "Dracode's enterprise CRM product. I built the Next.js frontend: 360° customer profiles, a drag-and-drop sales pipeline with forecasting, workflow automation, real-time analytics dashboards, milestone and deadline tracking, and Google Workspace integration.",
    links: [
      { name: "Product site", url: "https://fire.dracode.org/" },
    ],
  },
  {
    id: "sanae3y-pro",
    title: "Sanae3y Pro",
    role: "Mobile Engineer (Freelance)",
    description:
      "A home services mobile app where customers post a job and technicians send offers. I developed the app with real-time offers over WebSocket, map-based job posting, price negotiation, live technician tracking and Arabic (RTL) support.",
    links: [
      { name: "Google Play", url: "https://play.google.com/store/apps/details?id=com.blink.sanae3ypro" },
      { name: "App Store", url: "https://apps.apple.com/us/app/sanae3y-pro-%D8%B5%D9%86%D8%A7%D9%8A%D8%B9%D9%8A-%D8%A8%D8%B1%D9%88/id6774985991" },
    ],
  },
  {
    id: "real-estate-data",
    title: "Data Quality Audit",
    role: "Data Analysis (Kaggle)",
    description:
      "A 4-part notebook series on 2.2 million US real estate listings. I profiled completeness (90.1% overall, with 4 columns over 20% missing), found 115,000 inconsistent duplicate records (5.2%) and traced where they cluster by state, broker and year, and cut the dataset's memory use by 87.4% (668 MB to 84 MB) through data-type optimisation.",
    links: [
      { name: "Kaggle Notebooks", url: "#", isGrouped: true, groupedLinks: [
        { name: "Real Estate Data Discovery Analysis", url: "https://www.kaggle.com/code/mariamfathiamin/real-estate-data-discovery-analysis" },
        { name: "38.19% Suspicious Records", url: "https://www.kaggle.com/code/mariamfathiamin/38-19-suspicious-records" },
        { name: "87.4% Memory Opt + Suspicious Patterns", url: "https://www.kaggle.com/code/mariamfathiamin/87-4-memory-opt-real-estate-suspicious-patterns" },
        { name: "Real Estate Data Quality Visuals", url: "https://www.kaggle.com/code/mariamfathiamin/real-estate-data-quality-visuals" },
      ]},
    ],
  },
  {
    id: "rfm-segmentation",
    title: "Customer Segmentation",
    role: "Data Analysis (Kaggle)",
    description:
      "Customer segmentation of an online retail dataset (540,000 transactions, 4,339 customers). I segmented customers by recency, frequency and monetary value (RFM) and compared 5 clustering methods (K-Means, GMM, DBSCAN, BIRCH, Agglomerative); K-Means performed best (silhouette score 0.645).",
    links: [
      { name: "Kaggle", url: "https://www.kaggle.com/code/mariamfathiamin/uk-online-retail-rfm-clustering-formats-comparison" },
    ],
  },
  {
    id: "font-selection-agent",
    title: "Font Agent",
    role: "Kaggle AI Agents Capstone",
    description:
      "Capstone project for the Kaggle 5-Day AI Agents Intensive with Google. I built an AI agent with Google ADK and Gemini that helps developers pick a font: it asks about the project and style, searches a list of Google Fonts and shows the options side by side. I wrote Python tools that open the user's own page in a browser with Playwright, apply each font, take a screenshot and then restore the original file.",
    links: [
      { name: "Writeup", url: "https://www.kaggle.com/competitions/agents-intensive-capstone-project/writeups/new-writeup-1763196957997" },
      { name: "GitHub", url: "https://github.com/Mariam-Fathi/font-selection-agent" },
    ],
  },
];

// Match hero — same program, same palette.
const explorerPalette = {
  headline: COLORS.primary,
  body: COLORS.primary,
  link: COLORS.accent,
  accent: COLORS.accent,
};

export default function GalleryShowcase() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const project = projects[selectedIndex];
  const colors = explorerPalette;

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
      id="projects"
      className="relative w-full h-full flex flex-col p-0 font-sans min-h-0"
      style={{ background: COLORS.heroBackground }}
    >
      {/* Icon grid (Explorer-style) */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-visible py-0 no-visible-scrollbar">
   

        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-4 justify-items-center mt-10">
            {projects.map((p, i) => {
              const breadcrumbLabel = `portfolio / projects / ${p.title}`;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openModal(i)}
                  className="group cursor-pointer select-none"
                  style={{ background: "transparent" }}
                  aria-label={`Open project: ${p.title}`}
                >
                  <div className="flex flex-col items-center">
                    <span
                      className="text-[#e8e0cc]"
                      style={{
                        color: COLORS.accent,
                      }}
                    >
                      <FolderIcon open={false} />
                    </span>
                    <span
                      className="mt-1 text-[11px] font-sans leading-relaxed text-[#2a2a2a] bg-transparent"
                      style={{
                        color: "#280B0B",
                        textAlign: "center",
                        maxWidth: 140,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={breadcrumbLabel}
                    >
                      {p.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && project && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeModal}
            aria-hidden="true"
          />

          <div
            className="relative w-[92vw] max-w-[860px] max-h-[86vh] overflow-y-auto border-2 border-[#2a2a2a]"
            style={{ background: COLORS.heroBackground, boxShadow: "2px 2px 0 #1a1a1a" }}
          >
            {/* Header */}
            <div
              className="border-b-2 border-[#2a2a2a] px-4 md:px-5 py-2.5 flex items-center justify-between gap-3"
              style={{ background: COLORS.heroBackground }}
            >
              <span className="text-[11px] leading-relaxed" style={{ color: colors.headline, whiteSpace: "nowrap" }}>
                # {project.title} — {project.role}
              </span>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close project modal"
                className="flex items-center justify-center rounded-sm border-2 border-[#2a2a2a] px-2 py-1 transition hover:opacity-90"
                style={{ background: COLORS.heroBackground, color: colors.headline, boxShadow: "2px 2px 0 #1a1a1a" }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-4 md:px-5 py-4 space-y-5 no-visible-scrollbar">
              <div>
                <div className="mb-1">
                  <span className="text-[12px] font-bold" style={{ color: COLORS.primary }}>
                    Brief
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: colors.body }}>
                  {project.description}
                </p>
              </div>

              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: COLORS.accent }}>
                  Project Files
                </div>

                {project.links.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {project.links.map((link) => {
                      if (link.isGrouped && link.groupedLinks) {
                        return link.groupedLinks.map((gl, idx) => (
                          <a
                            key={`${idx}-${gl.url}`}
                            href={gl.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 border rounded-sm px-2.5 py-1.5 cursor-pointer hover:opacity-90 transition-all duration-150 group inline-flex"
                            style={{
                              background: COLORS.heroBackground,
                              borderColor: colors.accent,
                              boxShadow: "2px 2px 0 " + colors.accent,
                            }}
                          >
                            <span style={{ color: extColors.link }}>
                              <FileIcon ext="link" />
                            </span>
                            <span className="text-[10px] font-sans" style={{ color: colors.headline }}>
                              [{idx + 1}] {gl.name.length > 24 ? gl.name.slice(0, 24) + "…" : gl.name}
                            </span>
                            <ExternalLink className="w-3 h-3" style={{ color: colors.headline }} />
                          </a>
                        ));
                      }

                      return (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 border rounded-sm px-2.5 py-1.5 cursor-pointer hover:opacity-90 transition-all duration-150 group inline-flex"
                          style={{
                            background: COLORS.heroBackground,
                            borderColor: colors.accent,
                            boxShadow: "2px 2px 0 " + colors.accent,
                          }}
                        >
                          <span style={{ color: extColors.link }}>
                            <FileIcon ext="link" />
                          </span>
                          <span className="text-[10px] font-sans" style={{ color: colors.headline }}>
                            {link.name}
                          </span>
                          <ExternalLink className="w-3 h-3" style={{ color: colors.headline }} />
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] font-sans" style={{ color: "#8a7a5a" }}>
                    No public links for this project.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="border-t-2 border-[#2a2a2a] px-4 py-2.5 flex items-center justify-end"
              style={{ background: COLORS.heroBackground }}
            >
              <span className="text-[9px] font-sans" style={{ color: "#8a7a5a" }}>
                {String(selectedIndex + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
