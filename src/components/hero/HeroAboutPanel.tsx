const ROLE = {
  title: "Software Engineer",
  company: "Tarqia",
  fromDate: "Jan 2024",
  toDate: "Present",
} as const;

const ABOUT_PARAGRAPHS = [
  "I'm a computer engineer who builds production web and mobile systems, with a growing focus on data and AI.",
  "I joined Tarqia as an intern and was hired full-time based on my evaluation. Today I lead development of the admin portal for an IoT hotel access platform, working across web, mobile and hardware integration. I also mentored trainees in Tarqia's React programme, and alongside my role I build apps and business systems for clients.",
  "My graduation project was a multimodal deep learning system for interview videos, and I hold a professional certificate in data engineering on AWS. Building real products taught me how data is created, stored and used in live systems, and how to work with different teams and clients to turn requirements into working software.",
] as const;

export default function HeroAboutPanel() {
  return (
    <div
      data-hero-about-panel
      className="w-full rounded-[0px] border-2 border-[#280B0B] bg-[#F9E7C9] shadow-[2px_2px_0_#1a1a1a] overflow-hidden"
      style={{ maxWidth: "100%", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-[#1F6590] border-b-2 border-[#280B0B] px-3 py-2">
        <div className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "#EDE6D9" }}>
          ABOUT ME
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <div className="min-w-0 w-full max-w-[540px]">
          <div className="text-[12px] font-medium leading-tight">{ROLE.title}</div>
          <div className="text-[10px] leading-tight mt-0.5" style={{ color: "#E62A34" }}>
            {ROLE.company} <span style={{ opacity: 0.8 }}>|</span> {ROLE.fromDate} - {ROLE.toDate}
          </div>
          <div className="mt-3 flex flex-col gap-3 text-[10px] text-[#280B0B] leading-snug">
            {ABOUT_PARAGRAPHS.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
