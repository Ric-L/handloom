import React, { useState, useMemo, useEffect } from "react";
import {
  Play,
  Film,
  Camera,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  Video,
  Eye,
  MapPin,
  Clapperboard,
  Images,
} from "lucide-react";
import {
  MHHDCL_CHANNEL,
  MHHDCL_COUNTS,
  MHHDCL_MEDIA_ITEMS,
  type MhhdclMediaItem,
  type MediaKind,
} from "../data/mhhdclMedia";

type MediaFilter = "ALL" | MediaKind;

export const ProjectMediaSection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<MediaFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState<number>(9);
  const [activeItem, setActiveItem] = useState<MhhdclMediaItem | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const filterTabs = [
    { id: "ALL" as MediaFilter, label: `All Media (${MHHDCL_COUNTS.total})`, icon: Film },
    { id: "video" as MediaFilter, label: `Feature Videos (${MHHDCL_COUNTS.videos})`, icon: Video },
    { id: "short" as MediaFilter, label: `Handloom Shorts (${MHHDCL_COUNTS.shorts})`, icon: Clapperboard },
    { id: "photo" as MediaFilter, label: `Photo Stories (${MHHDCL_COUNTS.photos})`, icon: Images },
  ];

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MHHDCL_MEDIA_ITEMS.filter((item) => {
      if (activeFilter !== "ALL" && item.kind !== activeFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    });
  }, [activeFilter, searchQuery]);

  const handleFilterChange = (filter: MediaFilter) => {
    setActiveFilter(filter);
    // Show all immediately for focused smaller tabs; paginate 9/12 on large tabs
    if (filter === "video" || filter === "photo") {
      setVisibleLimit(50);
    } else if (filter === "short") {
      setVisibleLimit(12);
    } else {
      setVisibleLimit(9);
    }
  };

  const displayedItems = filteredItems.slice(0, visibleLimit);
  const hasMore = filteredItems.length > displayedItems.length;
  const remainingCount = filteredItems.length - displayedItems.length;

  const openModal = (item: MhhdclMediaItem) => {
    setActiveItem(item);
    setGalleryIndex(0);
  };

  const navigateModal = (direction: -1 | 1) => {
    if (!activeItem || filteredItems.length === 0) return;
    const idx = filteredItems.findIndex((x) => x.id === activeItem.id);
    if (idx === -1) return;
    const nextIdx = (idx + direction + filteredItems.length) % filteredItems.length;
    setActiveItem(filteredItems[nextIdx]);
    setGalleryIndex(0);
  };

  useEffect(() => {
    if (!activeItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveItem(null);
      if (e.key === "ArrowRight") navigateModal(1);
      if (e.key === "ArrowLeft") navigateModal(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeItem, filteredItems]);

  const badgeStyle = (kind: MediaKind) => {
    if (kind === "video") return "bg-[#8B5E3C] text-[#F5EFE3]";
    if (kind === "short") return "bg-[#3B3028] text-[#F5EFE3]";
    return "bg-[#5C6B45] text-[#F5EFE3]";
  };

  const kindDisplay = (kind: MediaKind) => {
    if (kind === "video") return "Feature Video";
    if (kind === "short") return "YouTube Short";
    return "Photo Story";
  };

  return (
    <section
      id="project-media"
      className="scroll-mt-20 py-10 sm:py-14 bg-[#FAF6EE] rounded-2xl border border-[#D9C5A3]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Official @MHHDCL Channel Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-[#D9C5A3]">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={MHHDCL_CHANNEL.avatarUrl}
              alt="MHHDCL YouTube Channel"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = "/mhhdcl-logo.png";
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#8B5E3C] bg-white shrink-0 shadow-xs"
            />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#EEF2E7] text-[#3E492D] border border-[#5C6B45]/30 mb-2">
                <Camera className="w-3.5 h-3.5 text-[#5C6B45]" />
                <span>Official YouTube Media Archive • {MHHDCL_CHANNEL.handle}</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#3B3028] tracking-tight">
                MHHDCL Craft Films, Shorts &amp; Field Gallery
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#6E5D50] max-w-2xl">
                {MHHDCL_CHANNEL.description} All {MHHDCL_COUNTS.videos} feature films,{" "}
                {MHHDCL_COUNTS.shorts} YouTube Shorts, and {MHHDCL_COUNTS.photos} community photo stories curated directly from{" "}
                <span className="font-semibold text-[#3B3028]">{MHHDCL_CHANNEL.handle}</span>.
              </p>
            </div>
          </div>

          <a
            href={MHHDCL_CHANNEL.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#3B3028] hover:bg-[#2A211B] text-[#F5EFE3] text-xs sm:text-sm font-semibold transition shadow-2xs shrink-0 self-start lg:self-auto"
          >
            <Video className="w-4 h-4 text-[#D9C5A3]" />
            <span>Visit @MHHDCL Channel</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>

        {/* Filter Tabs + Inline Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFilterChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${isSelected
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

          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-[#8D7B6D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, Kouna, Expo..."
              aria-label="Search MHHDCL media"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#D9C5A3] rounded-lg text-[#3B3028] placeholder-[#8D7B6D] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20"
            />
          </div>
        </div>

        {/* Media Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#D9C5A3] text-sm text-[#6E5D50]">
            No videos or stories matched &ldquo;{searchQuery}&rdquo;. Try clearing your search filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedItems.map((item) => {
              const isPlayable = item.kind === "video" || item.kind === "short";
              return (
                <article
                  key={item.id}
                  onClick={() => openModal(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openModal(item);
                    }
                  }}
                  className="group bg-white rounded-xl overflow-hidden border border-[#D9C5A3] shadow-2xs hover:shadow-md hover:border-[#8B5E3C] transition-all duration-300 cursor-pointer flex flex-col focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#2A211B]">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        if (e.currentTarget.src !== item.fallbackThumbnail) {
                          e.currentTarget.src = item.fallbackThumbnail;
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2A211B]/80 via-transparent to-black/25" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pr-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow backdrop-blur-md ${badgeStyle(
                          item.kind
                        )}`}
                      >
                        {kindDisplay(item.kind)}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#2A211B]/75 text-[#F5EFE3] backdrop-blur-md">
                        {item.categoryLabel}
                      </span>
                    </div>

                    {/* Center Play / View Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isPlayable ? (
                        <div className="w-14 h-14 rounded-full bg-[#8B5E3C]/95 text-[#F5EFE3] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border border-[#F5EFE3]/30">
                          <Play className="w-6 h-6 fill-[#F5EFE3] ml-0.5" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#3B3028]/80 text-[#F5EFE3] flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 backdrop-blur-sm">
                          <Images className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Bottom Right Badge (Duration / Image count / Views) */}
                    {(item.duration || (item.galleryImages && item.galleryImages.length > 1) || item.views) && (
                      <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-[#2A211B]/85 text-[11px] font-mono font-semibold text-[#F5EFE3] backdrop-blur-md flex items-center gap-1.5">
                        {item.duration ? (
                          <span>{item.duration}</span>
                        ) : item.galleryImages && item.galleryImages.length > 1 ? (
                          <span>{item.galleryImages.length} photos</span>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 text-[#D9C5A3]" />
                            <span>{item.views}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Meta */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#5C6B45] font-semibold mb-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>

                      <h3 className="font-serif text-lg text-[#3B3028] group-hover:text-[#8B5E3C] transition leading-snug mb-2 line-clamp-2">
                        {item.title}
                      </h3>

                      <p className="text-xs text-[#6E5D50] line-clamp-2 leading-relaxed mb-4">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E9DEC8] flex items-center justify-between text-xs text-[#6E5D50]">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#8D7B6D]" /> {item.publishedLabel}
                      </span>
                      <span className="text-[#8B5E3C] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        {isPlayable ? "Play Video" : "View Story"}{" "}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Load More / Show All Controls */}
        {hasMore && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setVisibleLimit((prev) => prev + 12)}
              className="px-5 py-2.5 rounded-lg bg-[#8B5E3C] hover:bg-[#704A2E] text-[#F5EFE3] text-xs sm:text-sm font-semibold transition shadow-2xs cursor-pointer"
            >
              Load More Media ({Math.min(12, remainingCount)} of {remainingCount} remaining)
            </button>
            <button
              type="button"
              onClick={() => setVisibleLimit(filteredItems.length)}
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-[#EDE3D2] text-[#3B3028] border border-[#D9C5A3] text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              Show All {filteredItems.length} Items
            </button>
          </div>
        )}

        {!hasMore && filteredItems.length > 9 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisibleLimit(activeFilter === "short" ? 12 : 9)}
              className="px-5 py-2 rounded-lg bg-white hover:bg-[#EDE3D2] text-[#3B3028] border border-[#D9C5A3] text-xs font-semibold transition cursor-pointer"
            >
              Collapse Grid
            </button>
          </div>
        )}

        {/* Embedded Player & Gallery Lightbox Modal */}
        {activeItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#2A211B]/85 backdrop-blur-md"
            onClick={() => setActiveItem(null)}
          >
            <div
              className="bg-[#FAF6EE] rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#D9C5A3] flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="px-4 py-3 bg-[#2A211B] border-b border-[#D9C5A3]/25 flex items-center justify-between text-[#F5EFE3] gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shrink-0 ${badgeStyle(
                      activeItem.kind
                    )}`}
                  >
                    {kindDisplay(activeItem.kind)}
                  </span>
                  <span className="text-xs text-[#D9C5A3] truncate">{activeItem.categoryLabel}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigateModal(-1)}
                    aria-label="Previous media item"
                    className="p-1.5 rounded-full bg-[#3B3028] hover:bg-[#8B5E3C] text-[#D9C5A3] hover:text-[#F5EFE3] transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateModal(1)}
                    aria-label="Next media item"
                    className="p-1.5 rounded-full bg-[#3B3028] hover:bg-[#8B5E3C] text-[#D9C5A3] hover:text-[#F5EFE3] transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    aria-label="Close media viewer"
                    className="p-1.5 rounded-full bg-[#3B3028] hover:bg-[#A9442A] text-[#D9C5A3] hover:text-[#F5EFE3] transition cursor-pointer ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Media Viewport */}
              <div className="relative bg-[#1E1713] flex items-center justify-center overflow-hidden">
                {activeItem.embedUrl ? (
                  activeItem.kind === "short" ? (
                    <div className="w-full max-w-[340px] aspect-[9/16] max-h-[58vh] mx-auto bg-black">
                      <iframe
                        key={activeItem.id}
                        src={activeItem.embedUrl}
                        title={activeItem.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-video max-h-[58vh] bg-black">
                      <iframe
                        key={activeItem.id}
                        src={activeItem.embedUrl}
                        title={activeItem.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  )
                ) : (
                  <div className="relative w-full flex items-center justify-center bg-[#1E1713] max-h-[58vh]">
                    <img
                      src={
                        activeItem.galleryImages?.[galleryIndex] || activeItem.thumbnail
                      }
                      alt={activeItem.title}
                      referrerPolicy="no-referrer"
                      className="max-h-[58vh] w-auto object-contain"
                    />
                    {activeItem.galleryImages && activeItem.galleryImages.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#2A211B]/85 px-3 py-1 rounded-full border border-[#D9C5A3]/30">
                        {activeItem.galleryImages.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setGalleryIndex(idx)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${galleryIndex === idx
                              ? "bg-[#8B5E3C] text-[#F5EFE3]"
                              : "text-[#D9C5A3] hover:text-white"
                              }`}
                          >
                            Photo {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Earthy Media Details Panel */}
              <div className="p-5 sm:p-6 bg-[#FAF6EE] text-[#3B3028] overflow-y-auto space-y-3 border-t border-[#D9C5A3]">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5C6B45] font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {activeItem.location}
                  </span>
                  <span>•</span>
                  <span>{activeItem.publishedLabel}</span>
                  {activeItem.duration && (
                    <>
                      <span>•</span>
                      <span>Duration {activeItem.duration}</span>
                    </>
                  )}
                  {activeItem.views && (
                    <>
                      <span>•</span>
                      <span>{activeItem.views}</span>
                    </>
                  )}
                </div>

                <h3 className="font-serif text-xl sm:text-2xl text-[#3B3028] leading-snug">
                  {activeItem.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#6E5D50] leading-relaxed whitespace-pre-line">
                  {activeItem.description}
                </p>

                <div className="pt-3 border-t border-[#E9DEC8] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-[#6E5D50] font-medium">
                    Source: Official MHHDCL YouTube Channel ({MHHDCL_CHANNEL.handle})
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <a
                      href={activeItem.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-[#EDE3D2] text-[#3B3028] border border-[#D9C5A3] text-xs font-semibold transition"
                    >
                      <Video className="w-4 h-4 text-[#8B5E3C]" />
                      <span>Open on YouTube</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveItem(null)}
                      className="px-4 py-2 rounded-lg bg-[#3B3028] hover:bg-[#2A211B] text-[#F5EFE3] text-xs font-semibold transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
