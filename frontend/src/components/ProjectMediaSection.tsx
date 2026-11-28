import React, { useState } from "react";
import {
  Play,
  Image as ImageIcon,
  Film,
  Camera,
  Maximize2,
  X,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  Eye,
  Video,
} from "lucide-react";

interface MediaItem {
  id: string;
  type: "video" | "photo";
  title: string;
  category: "Documentaries" | "Workshops" | "Exhibitions" | "Fieldwork";
  thumbnail: string;
  videoUrl?: string; // embedded or simulated stream
  duration?: string;
  location: string;
  date: string;
  description: string;
  credits: string;
}

const MEDIA_ITEMS: MediaItem[] = [
  {
    id: "med-01",
    type: "video",
    title: "Master Weavers of the Loin Loom: Preserving Indigenous Textile Heritage",
    category: "Documentaries",
    thumbnail:
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", // fallback demo
    duration: "05:42 Min",
    location: "Imphal East Traditional Craft Cluster, Manipur",
    date: "November 2026",
    description:
      "A deep dive into the painstaking tension-loom techniques handed down across generations. Witness how indigenous artisans weave intricate traditional patterns with back-strap tension and natural organic vegetable dyes.",
    credits: "Produced by MHHDC Media Division in collaboration with Regional Craft Trainers",
  },
  {
    id: "med-02",
    type: "photo",
    title: "Jacquard Loom Setup & Intricate Floral Punch-Card Weaving",
    category: "Workshops",
    thumbnail:
      "https://images.unsplash.com/photo-1606744888344-493238955de0?auto=format&fit=crop&w=900&q=80",
    location: "Accredited Training Centre No. 04, Textile Park",
    date: "October 2026",
    description:
      "Trainee artisans practicing jacquard loom harness threading and pattern synchronization. Over 360 candidates are receiving direct hands-on NSQF Level 4 training under expert master instructors.",
    credits: "Photography by MHHDC Visual Documentation Team",
  },
  {
    id: "med-03",
    type: "video",
    title: "From Silk Cocoon to Royal Fabric: The Handloom Reeling Journey",
    category: "Documentaries",
    thumbnail:
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80",
    duration: "07:18 Min",
    location: "Eri & Muga Sericulture Cluster, Imphal",
    date: "October 2026",
    description:
      "Explore the organic reeling of wild eri silk and traditional hand-spinning on the takli spindle. The video highlights how zero-carbon local production empowers rural women artisans.",
    credits: "MHHDC Craft Documentary Initiative",
  },
  {
    id: "med-04",
    type: "photo",
    title: "Hand Embroidery & Zardozi Needlework Masterclass",
    category: "Workshops",
    thumbnail:
      "https://images.unsplash.com/photo-1617050318658-a9a3175e34cb?auto=format&fit=crop&w=900&q=80",
    location: "Institute of Handicrafts & Design, Imphal",
    date: "September 2026",
    description:
      "Artisan apprentices mastering ari and zardozi raised embroidery on pure silk organza. Each piece integrates heritage motifs with contemporary home furnishing demands.",
    credits: "MHHDC Training Documentation Unit",
  },
  {
    id: "med-05",
    type: "photo",
    title: "Bamboo Split Weaving & Eco-Friendly Artisan Furnishings",
    category: "Workshops",
    thumbnail:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80",
    location: "Bamboo & Cane Craft Training Campus",
    date: "September 2026",
    description:
      "Fine bamboo filament processing and structural basketry. Trainees transform native raw bamboo into export-grade lampshades, dining ware, and traditional utility containers.",
    credits: "Field Photography: MHHDC Extension Wing",
  },
  {
    id: "med-06",
    type: "video",
    title: "Manipur Handloom Expo 2026: Artisan Showcase & Direct Sales",
    category: "Exhibitions",
    thumbnail:
      "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=900&q=80",
    duration: "04:15 Min",
    location: "Trade Fair Grounds, Imphal",
    date: "August 2026",
    description:
      "Over 120 certified trainee batches set up live stalls and direct-to-consumer weaver pavilions, generating over ₹34 Lakhs in cumulative sales without intermediaries.",
    credits: "MHHDC Marketing & Exhibition Division",
  },
];

export const ProjectMediaSection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);

  const filterTabs = [
    { id: "ALL", label: "All Media", icon: Film },
    { id: "video", label: "Videos & Documentaries", icon: Video },
    { id: "photo", label: "High-Res Photography", icon: Camera },
    { id: "Workshops", label: "Live Workshops", icon: Sparkles },
    { id: "Exhibitions", label: "Artisan Expos", icon: Eye },
  ];

  const filteredItems = MEDIA_ITEMS.filter((item) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "video") return item.type === "video";
    if (activeFilter === "photo") return item.type === "photo";
    return item.category === activeFilter;
  });

  return (
    <section id="project-media" className="scroll-mt-20 py-14 bg-[#FAF6EE] rounded-2xl border border-[#D9C5A3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#D9C5A3]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] bg-[#EEF2E7] text-[#3E492D] border border-[#5C6B45]/30 mb-3">
              <Camera className="w-3.5 h-3.5 text-[#5C6B45]" />
              Visual Archive &amp; Documentaries
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#3B3028] tracking-tight">
              Craft Films &amp; Field Gallery
            </h2>
            <p className="mt-2 text-sm text-[#6E5D50] max-w-2xl">
              Glimpses into weaving clusters, master craft demonstrations, live loom workshops, and exhibitions documenting our artisan community.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <span className="text-xs font-bold text-[#6E5D50] uppercase tracking-wider">
              {MEDIA_ITEMS.length} Media Features
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#8B5E3C] text-[#F5EFE3] shadow-xs"
                    : "bg-white text-[#3B3028] border border-[#D9C5A3] hover:bg-[#EDE3D2]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveItem(item)}
              className="group bg-white rounded-xl overflow-hidden border border-[#D9C5A3] shadow-2xs hover:shadow-md hover:border-[#8B5E3C] transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[#2A211B]">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                  loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2A211B]/80 via-transparent to-black/20" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-md text-[#F5EFE3] shadow backdrop-blur-md ${
                      item.type === "video" ? "bg-[#8B5E3C]/90" : "bg-[#5C6B45]/90"
                    }`}
                  >
                    {item.type === "video" ? "Video Documentary" : "Photo Feature"}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#2A211B]/75 text-[#F5EFE3] backdrop-blur-md">
                    {item.category}
                  </span>
                </div>

                {/* Play Button Overlay or Expand Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {item.type === "video" ? (
                    <div className="w-14 h-14 rounded-full bg-[#8B5E3C]/95 text-[#F5EFE3] flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                      <Play className="w-6 h-6 fill-[#F5EFE3] ml-0.5" />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#3B3028]/70 text-[#F5EFE3] flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 backdrop-blur-sm">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Duration / Tag footer on image */}
                {item.duration && (
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-[#2A211B]/85 text-[11px] font-mono font-bold text-[#F5EFE3] backdrop-blur-md">
                    {item.duration}
                  </div>
                )}
              </div>

              {/* Card Meta Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#5C6B45] font-semibold mb-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>

                  <h3 className="font-serif text-lg text-[#3B3028] group-hover:text-[#8B5E3C] transition leading-snug mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#6E5D50] line-clamp-2 leading-relaxed mb-4">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-[#E9DEC8] flex items-center justify-between text-xs text-[#6E5D50]">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#8D7B6D]" /> {item.date}
                  </span>
                  <span className="text-[#8B5E3C] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    {item.type === "video" ? "Watch Video" : "View Photo"} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Media Lightbox / Modal */}
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#2A211B]/80 backdrop-blur-md">
            <div className="bg-[#3B3028] rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#D9C5A3]/40 flex flex-col max-h-[92vh]">
              {/* Modal Top Bar */}
              <div className="p-4 bg-[#2A211B] border-b border-[#D9C5A3]/25 flex items-center justify-between text-[#F5EFE3]">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                      activeItem.type === "video" ? "bg-[#8B5E3C]" : "bg-[#5C6B45]"
                    }`}
                  >
                    {activeItem.type === "video" ? "Craft Video Player" : "High-Resolution Image"}
                  </span>
                  <span className="text-xs text-[#D9C5A3] font-mono">[{activeItem.id}]</span>
                </div>
                <button
                  onClick={() => setActiveItem(null)}
                  className="p-1.5 rounded-full bg-[#3B3028] hover:bg-[#8B5E3C] text-[#D9C5A3] hover:text-[#F5EFE3] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Media Display Area */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {activeItem.type === "video" ? (
                  <div className="w-full h-full relative group">
                    <img
                      src={activeItem.thumbnail}
                      alt={activeItem.title}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-6">
                      <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-900/60 mb-3 animate-pulse">
                        <Play className="w-7 h-7 fill-white ml-1" />
                      </div>
                      <p className="text-white text-sm font-bold">Craft Documentary Video Stream</p>
                      <p className="text-xs text-blue-200 mt-1 max-w-md">
                        MHHDC Media Stream • {activeItem.duration || "Full Feature"} • Verified Showcase
                      </p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={activeItem.thumbnail}
                    alt={activeItem.title}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Media Details */}
              <div className="p-6 bg-slate-900 text-slate-200 overflow-y-auto space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-blue-400 font-bold mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{activeItem.location}</span>
                    <span>•</span>
                    <span>{activeItem.date}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">{activeItem.title}</h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{activeItem.description}</p>

                <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>{activeItem.credits}</span>
                  <button
                    onClick={() => setActiveItem(null)}
                    className="px-4 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs transition self-end sm:self-auto"
                  >
                    Close Viewer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

