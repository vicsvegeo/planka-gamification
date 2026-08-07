/* eslint-disable no-console */

/**
 * Fork addition — manually triggers one project inactivity nudge scan cycle
 * without waiting for the daily project-nudge-scanner hook. Boots Sails the
 * same way db/upgrade.js (and run-card-reminder-scan.js) do for one-off
 * scripts, runs the scan, then exits.
 *
 * Usage: npm run db:scan-project-nudges
 */

const path = require('path');
const dotenv = require('dotenv');
const sails = require('sails');
const rc = require('sails/accessible/rc');

process.chdir(path.join(__dirname, '..'));
dotenv.config({ quiet: true });

const loadSails = () =>
  new Promise((resolve, reject) => {
    sails.load(
      {
        ...rc('sails'),
        log: {
          level: 'info',
        },
      },
      (error) => (error ? reject(error) : resolve()),
    );
  });

(async () => {
  try {
    await loadSails();

    const result = await sails.helpers.projectNudges.scan();

    console.log('Scan result:', result);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
})();
