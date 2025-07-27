import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function KillRaceChallenge() {
  const [status, setStatus] = useState('waiting'); // waiting, in_progress, submit, confirm, complete
  const [winnerConfirmed, setWinnerConfirmed] = useState(false);
  const [loserConfirmed, setLoserConfirmed] = useState<boolean | 'forfeit'>(false);
  const [timer, setTimer] = useState(300); // 5 minutes countdown

  useEffect(() => {
    if (status === 'confirm' && !loserConfirmed && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [status, timer, loserConfirmed]);

  useEffect(() => {
    if (status === 'confirm' && timer === 0 && !loserConfirmed) {
      setLoserConfirmed('forfeit');
    }
  }, [timer, status, loserConfirmed]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="text-center space-y-4">
          <h2 className="text-xl font-bold">Kill Race: Xbox vs PlayStation</h2>
          <p className="text-sm">Whoever gets more eliminations in a solo public match wins.</p>

          {status === 'waiting' && (
            <Button onClick={() => setStatus('in_progress')}>Both Ready - Start Match</Button>
          )}

          {status === 'in_progress' && (
            <div>
              <p className="text-green-500">Match in progress... Submit proof after the game.</p>
              <Button className="mt-4" onClick={() => setStatus('submit')}>Submit Proof</Button>
            </div>
          )}

          {status === 'submit' && (
            <div className="space-y-4">
              <p>Upload screenshot or clip of your match showing eliminations.</p>
              <Button onClick={() => setStatus('confirm')}>Submit Proof</Button>
            </div>
          )}

          {status === 'confirm' && (
            <div className="space-y-4">
              <p className="font-semibold">Confirm match outcome:</p>
              <Button onClick={() => setWinnerConfirmed(true)} disabled={winnerConfirmed}>I Won</Button>
              <Button onClick={() => setLoserConfirmed(true)} disabled={loserConfirmed === true}>I Lost</Button>
              {loserConfirmed === 'forfeit' && <p className="text-red-500">Loser did not confirm. Forfeit applied.</p>}
              {(winnerConfirmed && (loserConfirmed === true || loserConfirmed === 'forfeit')) && (
                <Button className="bg-green-600 mt-4" onClick={() => setStatus('complete')}>Payout Winner</Button>
              )}
              <p className="text-sm text-muted-foreground">Time left to confirm: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</p>
            </div>
          )}

          {status === 'complete' && (
            <div>
              <p className="text-green-500 font-bold">Match completed. Winnings paid out.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}