export type SeedChannel = {
  name: string;
  url: string;
  videosPerRun: number;
};

export const CHANNELS: SeedChannel[] = [
  { name: "TED", url: "https://www.youtube.com/@TED/videos", videosPerRun: 12 },
  { name: "TED-Ed", url: "https://www.youtube.com/@TEDEd/videos", videosPerRun: 12 },
  { name: "Vox", url: "https://www.youtube.com/@Vox/videos", videosPerRun: 12 },
  { name: "Veritasium", url: "https://www.youtube.com/@veritasium/videos", videosPerRun: 10 },
  { name: "Kurzgesagt", url: "https://www.youtube.com/@kurzgesagt/videos", videosPerRun: 10 },
  { name: "The School of Life", url: "https://www.youtube.com/@theschooloflife/videos", videosPerRun: 10 },
];
