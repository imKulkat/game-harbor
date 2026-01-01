import { games } from "@/config/games";
import { GameCard } from "./GameCard";
import { Gamepad2 } from "lucide-react";

export function GameGrid() {
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Gamepad2 className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">No games added yet</p>
        <p className="text-sm">Add games to src/config/games.ts</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
