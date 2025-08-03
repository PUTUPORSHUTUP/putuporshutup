import { useEffect, useState } from "react";
import { TournamentCard } from "./TournamentCard";

interface Tournament {
  id: string;
  title: string;
  description: string | null;
  entry_fee: number;
  max_participants: number;
  current_participants: number;
  prize_pool: number;
  platform: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  start_time: string | null;
  start_date?: string;
  created_at: string;
  game: {
    id: string;
    display_name: string;
    name: string;
  };
}

interface TournamentListProps {
  tournaments: Tournament[];
}

export function TournamentList({ tournaments }: TournamentListProps) {
  const [visibleTournaments, setVisibleTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    const now = new Date();

    const filtered = tournaments.filter((t) => {
      const date = new Date(t.start_time || t.start_date || t.created_at);
      return t.status === "open" && date >= now;
    });

    setVisibleTournaments(filtered);
  }, [tournaments]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {visibleTournaments.length > 0 ? (
        visibleTournaments.map((t) => (
          <TournamentCard key={t.id} tournament={t} />
        ))
      ) : (
        <p className="text-center text-muted-foreground col-span-full">
          No upcoming tournaments available.
        </p>
      )}
    </div>
  );
}