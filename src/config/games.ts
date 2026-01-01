// Add your games here - just add to the array!
export interface Game {
  id: string;
  title: string;
  description: string;
  path: string; // Will be appended to games.vesastar.top/
  coverImage?: string; // Optional cover image URL
  tags?: string[];
}

export const GAMES_BASE_URL = "https://games.vesastar.top";

export const games: Game[] = [
  // Example games - replace with your own!
  {
    id: "doom",
    title: "DOOM",
    description: "The classic FPS that started it all",
    path: "doom",
    tags: ["FPS", "Classic"],
  },
  {
    id: "quake",
    title: "Quake",
    description: "Fast-paced arena shooter",
    path: "quake",
    tags: ["FPS", "Arena"],
  },
  {
    id: "pacman",
    title: "Pac-Man",
    description: "Eat dots, avoid ghosts",
    path: "pacman",
    tags: ["Arcade", "Classic"],
  },
];
