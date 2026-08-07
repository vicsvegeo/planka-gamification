/**
 * card-reminder-scanner hook
 *
 * @description :: Fork addition. Runs the due-date reminder scan
 *                 (sails.helpers.cardReminders.scan) hourly, on the hour.
 *                 Matches the `watcher` hook's setInterval-based convention
 *                 for background jobs in this codebase — no cron dependency.
 */

const HOUR_IN_MS = 60 * 60 * 1000;

module.exports = function defineCardReminderScannerHook(sails) {
  const runScan = async () => {
    try {
      await sails.helpers.cardReminders.scan();
    } catch (error) {
      sails.log.error('[card-reminder-scanner] Scan run failed:', error);
    }
  };

  const scheduleNextRun = () => {
    const now = new Date();
    const msSinceTheHour =
      (now.getUTCMinutes() * 60 + now.getUTCSeconds()) * 1000 + now.getUTCMilliseconds();
    const msUntilNextHour = HOUR_IN_MS - msSinceTheHour;

    setTimeout(async () => {
      await runScan();
      scheduleNextRun();
    }, msUntilNextHour);
  };

  return {
    /**
     * Runs when this Sails app loads/lifts.
     */

    async initialize() {
      sails.log.info('Initializing custom hook (`card-reminder-scanner`)');

      scheduleNextRun();
    },
  };
};
