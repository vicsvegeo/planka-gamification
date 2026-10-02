/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

const serveStatic = require('serve-static');
const skipper = require('skipper');
const sails = require('sails');

// Paths whose handlers need the exact request bytes (HMAC signature checks).
const RAW_BODY_PATHS = ['/api/github/webhook'];

module.exports.http = {
  /**
   *
   * Sails/Express middleware to run for every HTTP request.
   * (Only applies to HTTP requests -- not virtual WebSocket requests.)
   *
   * https://sailsjs.com/documentation/concepts/middleware
   *
   */

  middleware: {
    /**
     *
     * The order in which middleware should be run for HTTP requests.
     * (This Sails app's routes are handled by the "router" middleware below.)
     *
     */
    // order: [
    //   'cookieParser',
    //   'session',
    //   'bodyParser',
    //   'compress',
    //   'poweredBy',
    //   'router',
    //   'www',
    //   'favicon',
    // ],
    /**
     *
     * The body parser that will handle incoming multipart HTTP requests.
     *
     * https://sailsjs.com/config/http#?customizing-the-body-parser
     *
     */
    // bodyParser: (function _configureBodyParser(){
    //   var skipper = require('skipper');
    //   var middlewareFn = skipper({ strict: true });
    //   return middlewareFn;
    // })(),

    // Default Sails body parser (skipper), plus `req.rawBody` for RAW_BODY_PATHS.
    bodyParser: skipper({
      verify(req, res, buffer) {
        if (RAW_BODY_PATHS.includes(req.path)) {
          req.rawBody = buffer;
        }
      },
      // Same as the Sails default.
      // eslint-disable-next-line no-unused-vars
      onBodyParserError(error, req, res, next) {
        sails.log.error(`Unable to parse HTTP body- error occurred :: ${error.stack || error}`);

        if (process.env.NODE_ENV === 'production') {
          return res.status(400).send();
        }

        return res.status(400).send(`Unable to parse HTTP body- error occurred :: ${error}`);
      },
    }),

    poweredBy: false,

    www(req, res, next) {
      const middleware = serveStatic(sails.config.paths.public, {
        maxAge: sails.config.http.cache,
        immutable: req.url.startsWith('/assets/'),
      });

      return middleware(req, res, next);
    },
  },
};
