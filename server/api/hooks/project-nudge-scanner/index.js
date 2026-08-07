/**
 * project-nudge-scanner hook
 *
 * @description :: Fork addition. Runs the project inactivity nudge scan
 *                 (sails.helpers.projectNudges.scan) once daily, at midnight
 *                 UTC. Same self-rescheduling setTimeout pattern as
 *                 card-reminder-scanner (hourly) and the `watcher` hook's
 *                 setInterval-based convention for background jobs in this
 *                 codebase — no cron dependency, just a longer interval.
 */

const DAY_IN_MS = 24 * 60 * 60 * 1000;

module.exports = function defineProjectNudgeScannerHook(sails) {
  const runScan = async () => {
    try {
      await sails.helpers.projectNudges.scan();
    } catch (error) {
      sails.log.error('[project-nudge-scanner] Scan run failed:', error);
    }
  };

  const scheduleNextRun = () => {
    const now = new Date();
    const msSinceMidnight =
      ((now.getUTCHours() * 60 + now.getUTCMinutes()) * 60 + now.getUTCSeconds()) * 1000 +
      now.getUTCMilliseconds();
    const msUntilNextMidnight = DAY_IN_MS - msSinceMidnight;

    setTimeout(async () => {
      await runScan();
      scheduleNextRun();
    }, msUntilNextMidnight);
  };

  return {
    /**
     * Runs when this Sails app loads/lifts.
     */

    async initialize() {
      sails.log.info('Initializing custom hook (`project-nudge-scanner`)');

      scheduleNextRun();
    },
  };
};
