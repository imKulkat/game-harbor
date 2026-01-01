import { Play, Gamepad2 } from "lucide-react";
import { Game, GAMES_BASE_URL } from "@/config/games";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const gameUrl = `${GAMES_BASE_URL}/${game.path}`;

  return (
    <a
      href={gameUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-xl bg-card border border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
    >
      {/* Cover Image or Placeholder */}
      <div className="aspect-video bg-gradient-to-br from-primary/20 via-secondary/30 to-accent/20 flex items-center justify-center relative overflow-hidden">
        {game.coverImage ? (
          <img
            src={game.coverImage}
            alt={game.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Gamepad2 className="w-16 h-16 text-primary/40" />
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Play className="w-8 h-8 text-primary-foreground ml-1" />
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
          {game.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {game.description}
        </p>
        
        {/* Tags */}
        {game.tags && game.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {game.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
