import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameModule } from '@/lib/gameModule';
import type { CompleteRunResponse, Referee } from '@/lib/refereeTypes';
import { useRoundStore } from '@/state/roundStore';
import { useSession } from '@/state/session';
import { appendAccountRun, appendGuestRun } from '@/lib/guestStorage';
import { MAX_SCORE } from '@/lib/scoring';
import { TimerRing } from '@/components/ui/TimerRing';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { ScoreCountUp } from '@/components/juice/ScoreCountUp';
import { ElasticScoreBar } from '@/components/juice/ElasticScoreBar';
import { TierStamp } from '@/components/juice/TierStamp';
import { ScreenShake } from '@/components/juice/ScreenShake';
import { ConfettiBurst } from '@/components/juice/ConfettiBurst';
import { ArcadeButton } from '@/components/ui/ArcadeButton';
import { Countdown, ErrorFrame, RoundIntro, SuspenseBeat } from '@/components/round/RoundFrames';
import { RunSummary } from '@/components/round/RunSummary';

const SUBMIT_RETRIES = 3;

/**
 * The round-flow engine (Epic 02, US2.1/2.2): hosts any GameModule and
 * drives the shared rhythm. Adding a game requires zero changes here.
 */
export function RoundFlow({
  module,
  referee,
  onExit,
}: {
  module: GameModule;
  referee: Referee;
  onExit: () => void;
}) {
  const store = useRoundStore();
  const { status, user, refreshProfile } = useSession();
  const inFlight = useRef(false);
  const [countUpDone, setCountUpDone] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [completion, setCompletion] = useState<CompleteRunResponse | null>(null);
  const persisted = useRef(false);

  const round = store.rounds[store.currentIndex];
  const lastResult = store.results[store.results.length - 1];

  /** Submit (or forfeit with null) the current round to the referee. */
  const submitToReferee = useCallback(
    async (answer: unknown | null) => {
      const { ticket } = useRoundStore.getState();
      const current = useRoundStore.getState().rounds[useRoundStore.getState().currentIndex];
      if (!ticket || !current || inFlight.current) return;
      inFlight.current = true;
      let lastError: unknown = null;
      for (let attempt = 0; attempt < SUBMIT_RETRIES; attempt++) {
        try {
          const result = await referee.submitAnswer({
            ticket,
            roundNo: current.roundNo,
            roundId: current.roundId,
            answer,
            clientTimeMs: 0,
          });
          setCountUpDone(false);
          useRoundStore.getState().scored(
            {
              roundNo: current.roundNo,
              answer,
              score: result.score,
              tier: result.tier,
              truth: result.truth,
            },
            result.ticket,
          );
          if (result.tier === 'PERFECT') setShakeCount((c) => c + 1);
          inFlight.current = false;
          return;
        } catch (err) {
          lastError = err;
          await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
        }
      }
      inFlight.current = false;
      useRoundStore
        .getState()
        .fail(lastError instanceof Error ? lastError.message : 'Scoring failed.');
    },
    [referee],
  );

  // Timer ticker: store-owned rAF loop while playing (decision 4), plus a
  // coarse interval fallback — rAF pauses entirely in hidden/background
  // tabs, and the round must still expire there (deadlines are absolute,
  // so a late tick lands on the correct remaining time).
  useEffect(() => {
    if (store.state !== 'playing') return;
    let raf = 0;
    const loop = () => {
      useRoundStore.getState().tick(Date.now());
      if (useRoundStore.getState().state === 'playing') raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const interval = window.setInterval(() => {
      useRoundStore.getState().tick(Date.now());
    }, 500);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
    };
  }, [store.state]);

  // Timer expiry lands in `scoring` with nothing in flight: forfeit (E1).
  useEffect(() => {
    if (store.state === 'scoring' && !inFlight.current) {
      void submitToReferee(null);
    }
  }, [store.state, submitToReferee]);

  const handleAnswer = useCallback(
    (answer: unknown) => {
      if (!module.validateAnswer(answer)) return;
      if (useRoundStore.getState().submit()) void submitToReferee(answer);
    },
    [module, submitToReferee],
  );

  // On completion: persist local history + finalize server-side (authed).
  useEffect(() => {
    if (store.state !== 'complete' || persisted.current) return;
    persisted.current = true;
    const results = useRoundStore.getState().results;
    const total = results.reduce((sum, r) => sum + r.score, 0);
    const localRun = {
      id: crypto.randomUUID(),
      gameSlug: module.slug,
      mode: 'quick' as const,
      totalScore: total,
      roundScores: results.map((r) => r.score),
      completedAt: new Date().toISOString(),
    };
    if (status === 'authed' && user) {
      appendAccountRun(user.id, localRun);
      const ticket = useRoundStore.getState().ticket;
      if (ticket) {
        void referee.completeRun(ticket).then((res) => {
          setCompletion(res);
          void refreshProfile();
        });
      }
    } else {
      appendGuestRun(localRun);
    }
  }, [store.state, module.slug, referee, status, user, refreshProfile]);

  // 'idle' means the async startRun() call is still in flight (Play.tsx
  // hasn't seeded the store yet) — this is normal loading, not a failure.
  // Without this check, the very first render (before that promise
  // resolves) fell through to the "no rounds" error below and flashed
  // "Something broke" on every fresh run, even though it was about to
  // load fine a moment later.
  if (store.state === 'idle') {
    return <SuspenseBeat label="Loading…" />;
  }

  if (!round && store.state !== 'complete' && store.state !== 'error') {
    return <ErrorFrame message="No rounds available." onRetry={onExit} onQuit={onExit} />;
  }

  const runningTotal = store.results.reduce((sum, r) => sum + r.score, 0);

  return (
    <div className="relative space-y-6">
      <ConfettiBurst trigger={shakeCount} />
      <ScreenShake trigger={shakeCount}>
        <header className="flex items-center justify-between">
          <ScoreDisplay score={runningTotal} max={store.rounds.length * MAX_SCORE} />
          {store.state === 'playing' && round && (
            <TimerRing
              remaining={store.timeRemainingMs / (round.timerSeconds * 1000)}
              label={`${Math.ceil(store.timeRemainingMs / 1000)}`}
            />
          )}
        </header>

        {store.state === 'intro' && round && (
          <RoundIntro
            gameName={module.displayName}
            roundNo={round.roundNo}
            totalRounds={store.rounds.length}
            onBegin={() => store.beginRound()}
          />
        )}

        {store.state === 'countdown' && round && (
          <Countdown onDone={() => store.countdownDone(round.timerSeconds)} />
        )}

        {store.state === 'playing' && round && store.deadline !== null && (
          <module.Play
            payload={round.payload as never}
            deadline={store.deadline}
            locked={false}
            onAnswer={handleAnswer as never}
          />
        )}

        {store.state === 'scoring' && <SuspenseBeat />}

        {store.state === 'reveal' && round && lastResult && (
          <div className="space-y-6 text-center">
            <div className="space-y-3">
              <ScoreCountUp score={lastResult.score} onDone={() => setCountUpDone(true)} />
              <ElasticScoreBar score={lastResult.score} />
              {countUpDone && <TierStamp tier={lastResult.tier} />}
            </div>
            <div className="text-left">
              <module.Reveal
                payload={round.payload as never}
                answer={lastResult.answer as never}
                truth={lastResult.truth}
                score={lastResult.score}
              />
            </div>
            <ArcadeButton size="lg" onClick={() => store.advance()} autoFocus>
              {store.currentIndex + 1 >= store.rounds.length ? 'Finish' : 'Next round'}
            </ArcadeButton>
          </div>
        )}

        {store.state === 'complete' && (
          <RunSummary
            results={store.results}
            totalRounds={store.rounds.length}
            onPlayAgain={() => {
              persisted.current = false;
              setCompletion(null);
              store.reset();
              onExit();
            }}
            xpGained={completion?.xpGained ?? null}
            leveledUp={completion?.leveledUp ?? false}
            newLevel={completion?.newLevel ?? null}
          />
        )}

        {store.state === 'error' && (
          <ErrorFrame
            message={store.lastError ?? 'Unknown error'}
            onRetry={() => {
              store.reset();
              onExit();
            }}
            onQuit={() => {
              store.reset();
              onExit();
            }}
          />
        )}
      </ScreenShake>
    </div>
  );
}
