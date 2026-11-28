export type MediaKind = "video" | "short" | "photo";

export interface MhhdclMediaItem {
  id: string;
  kind: MediaKind;
  youtubeId?: string;
  postUrl?: string;
  watchUrl: string;
  embedUrl?: string;
  title: string;
  categoryLabel: string;
  thumbnail: string;
  fallbackThumbnail: string;
  galleryImages?: string[];
  duration?: string;
  views?: string;
  publishedLabel: string;
  location: string;
  description: string;
}

export const MHHDCL_CHANNEL = {
  name: "MHHDCL",
  fullName: "Manipur Handloom & Handicrafts Development Corporation Ltd.",
  handle: "@MHHDCL",
  channelId: "UCBKNZZ2ZFzTiLky5BEtI2sQ",
  channelUrl: "https://www.youtube.com/@MHHDCL/videos",
  shortsUrl: "https://www.youtube.com/@MHHDCL/shorts",
  postsUrl: "https://www.youtube.com/@MHHDCL/posts",
  avatarUrl:
    "https://yt3.googleusercontent.com/GFHJKyNbyqNvBn8QwWY7j-k0FG1o3Pjo9Fx2He68M2dRD9RX8kvsJgTCub_QdBB9IKKTVb0rIA=s900-c-k-c0x00ffffff-no-rj",
  bannerUrl:
    "https://yt3.googleusercontent.com/IiS90-vwjDQ3J-gTFuwa0yRG1chEoRTawuZ9CZC8XBBaYJ5CxjJwFdF8OUaR7WkPwl2fXVVI=w2120-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj",
  description:
    "Authentic Manipur handloom, handicrafts, and artisan products. Supporting local artisans.",
} as const;

const FEATURE_VIDEOS: MhhdclMediaItem[] = [
  {
    id: "vid-kTA3pUe5eYg",
    kind: "video",
    youtubeId: "kTA3pUe5eYg",
    watchUrl: "https://www.youtube.com/watch?v=kTA3pUe5eYg",
    embedUrl: "https://www.youtube-nocookie.com/embed/kTA3pUe5eYg?autoplay=1&rel=0",
    title: "50 Years of MHHDCL | Weaving Heritage, Empowering Manipur's Artisans",
    categoryLabel: "Feature Film",
    thumbnail: "https://i.ytimg.com/vi/kTA3pUe5eYg/maxresdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/kTA3pUe5eYg/hqdefault.jpg",
    duration: "07:09",
    views: "48 views",
    publishedLabel: "06 Nov 2026",
    location: "MHHDCL HQ, Paona Bazar, Imphal",
    description:
      "Celebrating 50 years of the Manipur Handloom & Handicrafts Development Corporation Ltd. (MHHDCL). Covers IDP artisan toolkits, PM VIKAS training for 3,020 minority candidates, Ministry of Textiles skill initiatives, and women-led Kouna craft entrepreneurship featuring State Award winner Sarda Rajkumari.",
  },
  {
    id: "vid-zru5I8MJsM4",
    kind: "video",
    youtubeId: "zru5I8MJsM4",
    watchUrl: "https://www.youtube.com/watch?v=zru5I8MJsM4",
    embedUrl: "https://www.youtube-nocookie.com/embed/zru5I8MJsM4?autoplay=1&rel=0",
    title: "Manipur Takes Centre Stage at Textile Summit 2026 | USD 100 Billion Export Vision | MHHDCL",
    categoryLabel: "Export Summit",
    thumbnail: "https://i.ytimg.com/vi/zru5I8MJsM4/maxresdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/zru5I8MJsM4/hqdefault.jpg",
    duration: "00:38",
    views: "43 views",
    publishedLabel: "24 Jun 2026",
    location: "New Delhi • Ministry of Textiles Summit",
    description:
      "Senior officials of the Department of Handlooms & Textiles, Manipur participated in the Textile Summit 2026 ('Textiles for Global Markets') in New Delhi, presenting Manipur's strategic roadmap for global craft exports.",
  },
  {
    id: "vid-aXiz1-0MK_4",
    kind: "video",
    youtubeId: "aXiz1-0MK_4",
    watchUrl: "https://www.youtube.com/watch?v=aXiz1-0MK_4",
    embedUrl: "https://www.youtube-nocookie.com/embed/aXiz1-0MK_4?autoplay=1&rel=0",
    title: "Manipur Handlooms Go Global — Japan Places Export Order! | MHHDCL | Manipur Textiles 2025",
    categoryLabel: "Global Exports",
    thumbnail: "https://i.ytimg.com/vi/aXiz1-0MK_4/maxresdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/aXiz1-0MK_4/hqdefault.jpg",
    duration: "01:02",
    views: "50 views",
    publishedLabel: "11 Jun 2026",
    location: "Imphal & International Trade Delegation",
    description:
      "Japanese buyers M/s Yoka visited Manipur following the Manipur Textiles Expo 2025 and Nongin Festival, confirming an export order of 300 metres each across three colour variants of curated Manipuri handloom textiles.",
  },
  {
    id: "vid-rEYqE9aMfx4",
    kind: "video",
    youtubeId: "rEYqE9aMfx4",
    watchUrl: "https://www.youtube.com/watch?v=rEYqE9aMfx4",
    embedUrl: "https://www.youtube-nocookie.com/embed/rEYqE9aMfx4?autoplay=1&rel=0",
    title: "From Loom to Loom — Poiroukhongjil's Journey to Becoming Manipur's Model Weavers' Town",
    categoryLabel: "Weaving Clusters",
    thumbnail: "https://i.ytimg.com/vi/rEYqE9aMfx4/maxresdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/rEYqE9aMfx4/hqdefault.jpg",
    duration: "01:35",
    views: "146 views",
    publishedLabel: "10 Jun 2026",
    location: "Poiroukhongjil, Imphal East",
    description:
      "Directorate of Handlooms & Textiles officials visited Poiroukhongjil going from loom to loom to engage directly with weavers on quality standards, welfare, and market linkages as it transforms into Manipur's Model Weavers' Town.",
  },
  {
    id: "vid-36MgslPe7VI",
    kind: "video",
    youtubeId: "36MgslPe7VI",
    watchUrl: "https://www.youtube.com/watch?v=36MgslPe7VI",
    embedUrl: "https://www.youtube-nocookie.com/embed/36MgslPe7VI?autoplay=1&rel=0",
    title: "Handwoven Moirang Pheejil Silk with Shirui Lily Embroidery Presented at India–Italy Summit",
    categoryLabel: "GI Craft Diplomacy",
    thumbnail: "https://i.ytimg.com/vi/36MgslPe7VI/maxresdefault.jpg",
    fallbackThumbnail: "https://i.ytimg.com/vi/36MgslPe7VI/hqdefault.jpg",
    duration: "01:34",
    views: "235 views",
    publishedLabel: "21 May 2026",
    location: "Manipur Artisan Weaves • International Stage",
    description:
      "GI-tagged Moirang Pheejil silk embroidered with the Shirui Lily (State Flower of Manipur), handcrafted by artisans of MHHDCL, showcased globally as a tribute to Manipuri weaving excellence.",
  },
];

const POST_ENTRIES: Array<{
  id: string;
  title: string;
  published: string;
  location: string;
  text: string;
  images: string[];
}> = [
  {
    id: "UgkxpWQSD9VEHK2ug6LsCqhKbSICu_hiQf2v",
    title: "Nungbi Pottery: Dark Earthy Finish with Cane-Wrapped Handles",
    published: "Recent",
    location: "Nungbi Craft Tradition, Manipur",
    text: "Nungbi pottery is known for its dark, earthy finish and cane-wrapped handles. Each piece is shaped by hand and carries the patience of Manipur's artisans. Which piece would you pick: the tall mug, the goblet or the stacked trio?",
    images: [
      "https://yt3.ggpht.com/b0fE9qiysUUZgTkzgfR6Nmzr6x2h1ZY2EX4YfCBhnbNOQxPvcLDOcBm2jrpp45HSzE7DRdnIAsOE7g=s1600-c-fcrop64=1,00000000ffffffff-rw-nd-v1",
    ],
  },
  {
    id: "UgkxzfmefXujeEF5w68l8iF3OuwkDUID2yqD",
    title: "Handwoven Kouna Grass Bag with Floral Hand Embroidery",
    published: "Recent",
    location: "Manipur Women Weaver Collectives",
    text: "This is not just a bag. It's Manipur, woven by hand. This Kouna bag is handwoven from natural Kouna grass and finished with hand-embroidered flowers. Each piece is made by the weavers of Manipur — so no two are ever exactly the same.",
    images: [
      "https://yt3.ggpht.com/6UmuPLD6LW00NT9qEO5jf0_m7_ymB2wrwr16AVlaMekSSgiJKA9V7l_6Mruak9b-DpqrbjJm5Z0tDw=s1280-c-fcrop64=1,2aaa0000d555ffff-rw-nd-v1",
    ],
  },
  {
    id: "UgkxoKt0YB1wz2TNuLrLs2lhJCiYAGwGRzTn",
    title: "Woven by Hands, Worn with Pride — Traditional Textile Feature",
    published: "Recent",
    location: "Manipur Handloom Heritage",
    text: "Woven by hands, worn with pride. This isn't just fabric — it's hours of patience, tradition and pride from Manipur's weavers woven into every single thread. Handloom like this is made to be felt, not just seen.",
    images: [
      "https://yt3.ggpht.com/2D7IX7c-dVeRmsytPXLK1-FINTfPyKsPQP4c54KOTw_MXY9XKj4cO2rADNEwUsJ5klOBfjyJ03Mj5w=s1152-c-fcrop64=1,00000000ffffffff-rw-nd-v1",
    ],
  },
  {
    id: "UgkxRv1_JlX8HRu7ASUEWenrdCgJiEofZRVm",
    title: "Mera Hou Chongba — Festival of Brotherhood & Unity in Manipur",
    published: "1 month ago",
    location: "Manipur Cultural Celebration",
    text: "Mera Hou Chongba - Festival of Brotherhood & Unity in Manipur | Mera Thaumei.",
    images: [
      "https://yt3.ggpht.com/6mbcVO0Bb9wKfJB56_gtMTJQ9sIyPIGVDL28QVfx6Se1klWC2x8kgD9FH3ACIkjSibRyJXYocrY9cA=s1600-c-fcrop64=1,00000000ffffffff-rw-nd-v1",
    ],
  },
  {
    id: "UgkxScwRiOkeY77g4epPL5EmoC0N8ZnfBVte",
    title: "Natural Handwoven Kouna Yoga Mat — Artisan Craft Feature",
    published: "5 months ago",
    location: "Kouna Artisan Families, Manipur",
    text: "Natural Handwoven Yoga Mat from Manipur | International Day of Yoga 2026. Every mat is handcrafted — no factories, no machines. Buying a Kouna mat directly supports artisan families of Manipur who have kept this craft alive for generations.",
    images: [
      "https://yt3.ggpht.com/ptZE-lfKPIvWYuBlaodylxVVvBTWiraDydMkufO8TcZGhi8vgEwPzrFu5Zo1XzFyL0dznFTQLcAFyA=s912-c-fcrop64=1,0000193dffffe6c2-rw-nd-v1",
    ],
  },
  {
    id: "Ugkxj0kHOocn5d1pW6qqe2l9Q0aMYsgRwMj_",
    title: "Manipur's Loktak Tea Highlighted on Diplomatic Stage",
    published: "6 months ago",
    location: "Manipur Speciality Produce",
    text: "Manipur's Loktak Tea presented during India–Sweden diplomatic exchange.",
    images: [
      "https://yt3.ggpht.com/m0OSj88-rgPasoXeZXPqYkh_-fXzWzTPo9o6wM3PtFlOwu6_5F80XSz5XUgjJIUtl6TbAIKEFu0T=s1024-c-fcrop64=1,00000000ffffffff-rw-nd-v1",
    ],
  },
  {
    id: "UgkxaiiyMkkMh8KWrEwpuZ1BhMXh97b4TcH8",
    title: "A Mother's Love — Handcrafted by Life (Mother's Day Feature)",
    published: "6 months ago",
    location: "MHHDCL Community Spotlight",
    text: "A mother's love — handcrafted by life. Happy Mother's Day from MHHDCL.",
    images: [
      "https://yt3.ggpht.com/KdIJaNn4EzgD_EFylmkESn28uhiwEdrP9K-80Cur-5kuHrdSWhb0LMphRTW0Mm3Tebd_yYQ_-b4B_Q=s973-c-fcrop64=1,0f300000f0cfffff-rw-nd-v1",
    ],
  },
  {
    id: "Ugkx2URBE_vQ9_R-FdO-b7kyqeqo6MFsCoyF",
    title: "Ratha Yatra & Bahuda Yatra Community Greetings",
    published: "4 months ago",
    location: "MHHDCL Official Bulletin",
    text: "Warm wishes on the auspicious occasion of Ratha Yatra/Bahuda Yatra. May peace, happiness, and prosperity reach every artisan household.",
    images: [
      "https://yt3.ggpht.com/qNGLvODa4kqfBxp4EPGjg7Isf8ydUQJ9ENA8EAjcdPXUKRVuTnh9pooDlj2GYgDI_xfw1qPMHl83=s960-c-fcrop64=1,00001016ffffefe9-rw-nd-v1",
    ],
  },
  {
    id: "UgkxRWMJqal3JxXPhkMI0ZNcvlWcP4sHEJgF",
    title: "Sajibu Cheiraoba Cultural New Year Showcase",
    published: "7 months ago",
    location: "Imphal, Manipur",
    text: "Happy Sajibu Cheiraoba to everyone from the MHHDCL artisan family.",
    images: [
      "https://yt3.ggpht.com/Y3Q4e27A4eLSdzJU0yXvveseG4nCFaBbBs24N6O-2CZNMz3mhzHmN0Z7EeDkkPjkfuCqw1EAYu9Z=s1080-c-fcrop64=1,000000007c34ffff-rw-nd-v1",
    ],
  },
  {
    id: "UgkxXJOhfZnxtr6SBDRUoX8a8SdwM1ISDEwJ",
    title: "Sajibu Cheiraoba — Celebrating Manipur Craft Traditions",
    published: "7 months ago",
    location: "Imphal, Manipur",
    text: "Happy Sajibu Cheiraoba to everyone! #sajibucheiraoba #manipurculture #newyearcelebration",
    images: [
      "https://yt3.ggpht.com/2THemPPSie8EuA5dfXJ3-dElnlZEE-mlWVHYBMTDnxO5IxVGaXmPAx-ra63EBnWZ6IIst_6a04q6-w=s1080-c-fcrop64=1,000000007c34ffff-rw-nd-v1",
    ],
  },
  {
    id: "Ugkx7xqGiVHuxOt2kp4bkM14A4ft64sYPMU4",
    title: "Cheiraoba Greetings — Wishing Prosperity to Weavers",
    published: "8 months ago",
    location: "Manipur Handloom Community",
    text: "Happy Cheiraoba — May this new year bring happiness, good health and prosperity to you and your family.",
    images: [
      "https://yt3.ggpht.com/vzWEDDJKkXoIF4MAYPNnTtqIw16w3V0rYovCvBxol50czDLvP1Q8K-HJ1uI-pI3ALSWeC91_nQbX15M=s2551-c-fcrop64=1,2ec40000d13bffff-rw-nd-v1",
    ],
  },
  {
    id: "UgkxAAwj1fw5wtrGe1J3DXc6E5l9kaZk2H-Z",
    title: "Yaoshang 2026 — Celebrating Manipur's Heritage & Unity",
    published: "8 months ago",
    location: "Manipur Festival Gallery",
    text: "On the auspicious occasion of Yaoshang, we extend warm greetings to the people of Manipur. May the sacred Yaoshang fire inspire renewed hope, strengthen cultural pride, and encourage collective progress across our state.",
    images: [
      "https://yt3.ggpht.com/2j7saDRrNBene5e3WUnijDpOTT_svRre_U6jr9HRHUo9WEeP05Abd5JIJRG_y3YnDQqHgILk3wFFaQ=s1080-c-fcrop64=1,63c40000f60cffff-rw-nd-v1",
      "https://yt3.ggpht.com/cpkN3YkX8RIhqVmFGSfirZunKO3_fa4JO2uobV1KVyLO03R0WxXP5173qTD4-nqhZ7-iz2dk8HYK=s1080-c-fcrop64=1,00000000aaaaffff-rw-nd-v1",
    ],
  },
];

const SHORT_ENTRIES: Array<{
  id: string;
  title: string;
  views: string;
  age: string;
  category?: string;
}> = [
  { id: "9i3j-ZwFVE8", title: "Saphee Lanphee - Manipur's Legendary Shawl of Honour | GI Tagged Handloom", views: "147 views", age: "1mo ago", category: "GI Handloom" },
  { id: "D-aIpP2Yoyc", title: "MHHDCL Handloom Fashion | Wear the Heritage of Manipur", views: "338 views", age: "2mo ago", category: "Heritage Fashion" },
  { id: "JBC4BpWmNjQ", title: "Pheingou Gent Shawl, Kabui | Manipur Handloom Heritage", views: "1.3K views", age: "2mo ago", category: "Tribal Weaves" },
  { id: "XQAvzCS7Kuw", title: "No Wire, No Battery - Wooden Handcrafted Amplifier Made in Manipur", views: "401 views", age: "2mo ago", category: "Handicrafts" },
  { id: "zGmJ3zdEdT8", title: "WEAR THE HERITAGE | Manipuri Handloom Woven By Hand", views: "1.2K views", age: "2mo ago", category: "Handloom Reel" },
  { id: "xUOVTxIvKpM", title: "Happy Teachers' Day 2026 | Honoring Our Master Trainers & Mentors", views: "691 views", age: "2mo ago", category: "Campaign" },
  { id: "FCMFTNT4NwE", title: "Happy Janmashtami 2026 | MHHDCL Wishes You Joy & Prosperity", views: "66 views", age: "2mo ago", category: "Campaign" },
  { id: "-vFu6GQqTtk", title: "Soft Toys Handmade in Manipur — Artisan Craft Showcase", views: "32 views", age: "2mo ago", category: "Handicrafts" },
  { id: "43LtivNzQAI", title: "Handwoven in Manipur, Living in Delhi, New York, Paris & Tokyo", views: "246 views", age: "2mo ago", category: "Global Reach" },
  { id: "I76l2cul7lk", title: "Handwoven Folder Reveal | Handloom Craft, Reimagined", views: "38 views", age: "3mo ago", category: "Product Innovation" },
  { id: "E_08CdVnsts", title: "Who Says Tradition Isn't Stylish? — Contemporary Manipuri Handloom", views: "26 views", age: "3mo ago", category: "Heritage Fashion" },
  { id: "wmq4q_1ulbQ", title: "Acrylic Dhari Phanek with Dhari Innaphi Suit | Manipuri Traditional Wear", views: "224 views", age: "3mo ago", category: "Traditional Weaves" },
  { id: "UvouLOtLLhY", title: "Manao × Phanek Mayek Naibi — Tradition, Identity & Pride", views: "613 views", age: "3mo ago", category: "Traditional Weaves" },
  { id: "41Mf0tRl-HU", title: "80 Years of Freedom | Honouring Heroes of Manipur", views: "179 views", age: "3mo ago", category: "Commemoration" },
  { id: "6j0PgSgFzfA", title: "13th August Patriots' Day Tribute | Manipur Handloom Community", views: "536 views", age: "3mo ago", category: "Commemoration" },
  { id: "D-M6l_M93XA", title: "Har Ghar Tiranga | Independence Day Celebration at MHHDCL", views: "23 views", age: "3mo ago", category: "Campaign" },
  { id: "-bifdw12WIs", title: "Hathkargha Mela — State Handloom Expo 2026 at Urban Haat, Nilakuthi", views: "205 views", age: "4mo ago", category: "Handloom Expo" },
  { id: "d1Z-FJVd9QE", title: "Muga Waistcoat + Salai Taret Khudei — Manipur Handloom Heritage Look", views: "113 views", age: "5mo ago", category: "Heritage Fashion" },
  { id: "dWy6FtII70g", title: "The Maram Gents Shawl | Tribal Weaves of Manipur", views: "251 views", age: "5mo ago", category: "Tribal Weaves" },
  { id: "drJKd6l_UzQ", title: "The Chongkhom Kachon with Rose Kashan (Tangkhul Weave)", views: "792 views", age: "5mo ago", category: "Tribal Weaves" },
  { id: "4niV8_RUV64", title: "Handcrafted Krishna & Radha Idols | Manipur Artisan Creations", views: "70 views", age: "5mo ago", category: "Handicrafts" },
  { id: "bhg0qncUY88", title: "Manipuri Dhari Phanek × Check Enaphee | MHHDC Ltd Showcase", views: "250 views", age: "6mo ago", category: "Traditional Weaves" },
  { id: "ucAAH1ndxmc", title: "SEAP Consultative Meeting | Manipur Textile Export Action Plan 2026", views: "205 views", age: "6mo ago", category: "Policy & Export" },
  { id: "EijTVLMaGYU", title: "Rani Marak Taibi with Thambal Leikhok Mayek Naibi", views: "361 views", age: "6mo ago", category: "Traditional Weaves" },
  { id: "q7mRhb3yE_g", title: "Export Grooming Phase II — Directorate of Handlooms & Textiles", views: "99 views", age: "6mo ago", category: "Export Training" },
  { id: "9YyyRYNuoI0", title: "Khurumjari: Carrying Manipur's Legacy Forward by Handloom", views: "125 views", age: "6mo ago", category: "Handloom Reel" },
  { id: "60hR_c7D2Es", title: "Authentic Manipuri Innaphi | Handmade in India by MHHDCL Artisans", views: "435 views", age: "7mo ago", category: "Traditional Weaves" },
  { id: "VcF6mylp2y4", title: "Nongin Utsav Preparation Walkthrough | Handloom Showcase", views: "389 views", age: "8mo ago", category: "Exhibitions" },
  { id: "IWqnMobwVuQ", title: "Virasat Shakti Handloom Expo Inaugurated at Handloom Haat, New Delhi", views: "466 views", age: "8mo ago", category: "Handloom Expo" },
  { id: "uUF_1IxmfX8", title: "Celebrating Women Artisans Who Shape Our Society", views: "269 views", age: "8mo ago", category: "Women Artisans" },
  { id: "5TxKTn3M6WA", title: "Traditional Attire & Cultural Pride of Manipur", views: "1.6K views", age: "8mo ago", category: "Heritage Fashion" },
  { id: "OsDhKid1XCM", title: "Gandhi Bunkar Mela 2026 | Real Craft, Real Weavers, Real Impact", views: "33 views", age: "9mo ago", category: "Handloom Expo" },
  { id: "8QgN0GrtuT4", title: "Manipur Handwoven Runway Showcase | Gandhi Bunkar Mela, New Delhi", views: "284 views", age: "9mo ago", category: "Runway Showcase" },
  { id: "YqID0SvPrtg", title: "Manipur's Sacred Warrior Shawl: The Secrets of Saphee Lanphee", views: "227 views", age: "9mo ago", category: "GI Handloom" },
  { id: "1kZ1KQ8u6Hs", title: "Celebrating Handlooms at Gandhi Bunkar Mela, Janpath, New Delhi", views: "249 views", age: "9mo ago", category: "Handloom Expo" },
];

const PHOTO_STORIES: MhhdclMediaItem[] = POST_ENTRIES.map((p) => ({
  id: `post-${p.id}`,
  kind: "photo",
  postUrl: `https://www.youtube.com/post/${p.id}`,
  watchUrl: `https://www.youtube.com/post/${p.id}`,
  title: p.title,
  categoryLabel: "Photo Story",
  thumbnail: p.images[0],
  fallbackThumbnail: "/mhhdcl-logo.png",
  galleryImages: p.images,
  publishedLabel: p.published,
  location: p.location,
  description: p.text,
}));

const SHORTS_ITEMS: MhhdclMediaItem[] = SHORT_ENTRIES.map((s) => ({
  id: `short-${s.id}`,
  kind: "short",
  youtubeId: s.id,
  watchUrl: `https://www.youtube.com/shorts/${s.id}`,
  embedUrl: `https://www.youtube-nocookie.com/embed/${s.id}?autoplay=1&rel=0`,
  title: s.title,
  categoryLabel: s.category || "Handloom Short",
  thumbnail: `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg`,
  fallbackThumbnail: `https://i.ytimg.com/vi/${s.id}/mqdefault.jpg`,
  views: s.views,
  publishedLabel: s.age,
  location: "@MHHDCL • Manipur",
  description: `${s.title} — Official YouTube Short published by Manipur Handloom & Handicrafts Development Corporation Ltd. (@MHHDCL).`,
}));

export const MHHDCL_MEDIA_ITEMS: MhhdclMediaItem[] = [
  ...FEATURE_VIDEOS,
  ...PHOTO_STORIES,
  ...SHORTS_ITEMS,
];

export const MHHDCL_COUNTS = {
  total: MHHDCL_MEDIA_ITEMS.length,
  videos: FEATURE_VIDEOS.length,
  shorts: SHORTS_ITEMS.length,
  photos: PHOTO_STORIES.length,
};
