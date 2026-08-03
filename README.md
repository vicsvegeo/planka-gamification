<div align="center">

  ![Logo](https://raw.githubusercontent.com/plankanban/planka/master/assets/logo.png)

  # PLANKA

  _Project mastering driven by fun_

  ![Version](https://img.shields.io/github/package-json/v/plankanban/planka?style=flat-square) [![Docker Pulls](https://img.shields.io/badge/docker_pulls-8M%2B-%23066da5?style=flat-square&color=red)](https://github.com/plankanban/planka/pkgs/container/planka) [![Contributors](https://img.shields.io/github/contributors/plankanban/planka?style=flat-square&color=blue)](https://github.com/plankanban/planka/graphs/contributors) [![Chat](https://img.shields.io/discord/1041440072953765979?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/WqqYNd7Jvt)

  [Install](https://docs.planka.cloud/docs/installation/docker/production-version/) ·  [Demo](https://planka.app) · [Docs](https://docs.planka.cloud/docs/welcome/) · [API](https://plankanban.github.io/planka/swagger-ui/) · [Cloud](https://planka.app/pricing) · [Pro version](https://planka.app/pro)

  ![Demo](https://raw.githubusercontent.com/plankanban/planka/master/assets/demo.gif)

</div>

## Key Features

- **Collaborative Kanban Boards:** Create projects, boards, lists, cards, and manage tasks with an intuitive drag-and-drop interface
- **Real-Time Updates:** Instant syncing across all users, no refresh needed
- **Rich Markdown Support:** Write beautifully formatted card descriptions with a powerful markdown editor
- **Flexible Notifications:** Get alerts through 100+ providers, fully customizable to your workflow
- **Seamless Authentication:** Single sign-on with OpenID Connect integration
- **Multilingual & Easy to Translate:** Full internationalization support for a global audience

## Gamification (this fork)

This fork layers an XP/level/badge system on top of ordinary card completion — no separate "quest" concept, just Planka cards.

- **XP & leveling** — every card carries an XP value (`baseXp`, required, defaults to 10). Completing a card (moving it into a "closed"-type list) awards that XP to whoever completed it and recomputes their level using an `XP needed = 100 * level^1.5` curve, so early levels come fast and later ones slow down. XP is only ever awarded once per card, even if it's reopened and re-closed.
- **Soft due dates & on-time bonus** — cards can optionally carry a loose `softDueDate`, separate from Planka's normal due date. Completing on or before it grants a one-time 40% XP bonus; missing it costs nothing.
- **Badges** — a small rule-based badge engine checks every completion against a registry of badge definitions and unlocks any newly-earned ones. Starter set: First Blood, Getting Started, On a Roll, Punctual, Level 5, Level 10, and Clean Sweep (clearing out an entire list in one go).
- **Per-user stats** — everything is scoped by user from day one (`GET /api/users/:id/gamification-stats` returns XP, level, progress to next level, completion/on-time counts, and the full badge catalog with unlock status), so it already works for multiple board members, not just a single-player setup.
- **UI** — a level/XP/badge-count widget lives in the header, with level-up and badge-unlocked toasts, and a badge profile popup showing earned + locked achievements with descriptions. The XP value is viewable/editable in both the compact card tile and the expanded card view; soft due date is editable there too.

New database tables: `user_stats`, `card_gamification`, `badge`, `badge_unlock`. Existing cards from before this feature shipped are backfilled with a default 10 XP by migration, so nothing breaks on an upgrade.

## How to Deploy

PLANKA is easy to install using multiple methods - learn more in the [installation guide](https://docs.planka.cloud/docs/welcome/).

For configuration and environment settings, see the [configuration section](https://docs.planka.cloud/docs/category/configuration/).

Interested in a hosted or [Pro version](https://planka.app/pro) of PLANKA? Check out the pricing on our [website](https://planka.app/pricing).

## Notes App

A testing version of the Notes app is now available on multiple platforms:

- **iOS:** Join the [TestFlight](https://testflight.apple.com/join/5eJqTaJW) to try the app
- **Windows & Android:** Download the app [here](https://planka-notes.hillerdaniel.de)

## Contact

For any security issues, please do not create a public issue on GitHub - instead, report it privately by emailing [security@planka.group](mailto:security@planka.group).

**Note:** We do NOT offer any public support via email, please use GitHub.

**Join our community:** Get help, share ideas, or contribute on our [Discord server](https://discord.gg/WqqYNd7Jvt).

## License

PLANKA is [fair-code](https://faircode.io) distributed under the [Fair Use License](https://github.com/plankanban/planka/blob/master/LICENSES/PLANKA%20Community%20License%20EN.md) and [PLANKA Pro/Enterprise License](https://github.com/plankanban/planka/blob/master/LICENSES/PLANKA%20Commercial%20License%20EN.md).

- **Source Available:** The source code is always visible
- **Self-Hostable:** Deploy and host it anywhere
- **Extensible:** Customize with your own functionality
- **Enterprise Licenses:** Available for additional features and support

For more details, check the [License Guide](https://github.com/plankanban/planka/blob/master/LICENSES/PLANKA%20License%20Guide%20EN.md).

## Contributing

Found a bug or have a feature request? Check out our [Contributing Guide](https://github.com/plankanban/planka/blob/master/CONTRIBUTING.md) to get started.

For setting up the project locally, see the [development section](https://docs.planka.cloud/docs/category/development/).

**Thanks to all our contributors!**

[![Contributors](https://contrib.rocks/image?repo=plankanban/planka)](https://github.com/plankanban/planka/graphs/contributors)
