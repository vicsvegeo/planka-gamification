/*!
 * Fork addition — the project inactivity nudge scanner. Evaluates every
 * project with recorded activity and, once it's been quiet long enough,
 * nudges whoever's assigned to any of its cards (or the instance owner, if
 * no one is) — unless that specific person has snoozed nudges for this
 * project.
 *
 * Tiers by daysSilent (now - project.lastActivityAt):
 *   < 7   -> skip
 *   7-29  -> "stale"
 *   30+   -> "very stale" (message includes a snooze hint)
 *
 * Dedup: a project is skipped entirely if a project_nudges row already
 * exists for it within the last DEDUP_WINDOW_DAYS days — one row per project
 * per nudge cycle, not one per recipient (mirrors card_reminders' per-card,
 * not per-recipient, dedup shape). The row is only written after a
 * successful dispatch to at least one recipient; if every candidate
 * recipient has this project snoozed (or every dispatch attempt fails),
 * nothing is logged and the project is re-evaluated on the next run.
 */

/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */

const { Tiers, buildProjectNudgeMessage } = require('../../../utils/project-nudge-templates');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STALE_THRESHOLD_DAYS = 7;
const VERY_STALE_THRESHOLD_DAYS = 30;
const DEDUP_WINDOW_DAYS = 7;

const computeDaysSilent = (lastActivityAt, now) =>
  Math.floor((now.getTime() - lastActivityAt.getTime()) / MS_PER_DAY);

const selectTier = (daysSilent) => {
  if (daysSilent >= VERY_STALE_THRESHOLD_DAYS) {
    return Tiers.VERY_STALE;
  }
  if (daysSilent >= STALE_THRESHOLD_DAYS) {
    return Tiers.STALE;
  }
  return null;
};

module.exports = {
  async fn() {
    const now = new Date();

    const projectsWithActivity = await Project.qm.getWithLastActivity();

    const candidateProjects = projectsWithActivity
      .map((project) => {
        const daysSilent = computeDaysSilent(new Date(project.lastActivityAt), now);
        const tier = selectTier(daysSilent);

        return tier && { project, daysSilent, tier };
      })
      .filter(Boolean);

    if (candidateProjects.length === 0) {
      sails.log.info(
        '[project-nudges] No projects past the inactivity threshold — nothing to scan.',
      );
      return { evaluated: projectsWithActivity.length, sent: 0 };
    }

    const projectIds = sails.helpers.utils.mapRecords(candidateProjects, 'project.id');

    const [boards, existingNudges, ownerUser] = await Promise.all([
      Board.qm.getByProjectIds(projectIds),
      ProjectNudge.qm.getByProjectIds(projectIds),
      User.qm.getOneOwner(),
    ]);

    const nudgesByProjectId = _.groupBy(existingNudges, 'projectId');
    const boardById = _.keyBy(boards, 'id');

    const boardIds = sails.helpers.utils.mapRecords(boards);
    const cards = await Card.qm.getByBoardIds(boardIds);
    const cardById = _.keyBy(cards, 'id');

    const cardIds = sails.helpers.utils.mapRecords(cards);
    const cardMemberships = await CardMembership.qm.getByCardIds(cardIds);

    // Distinct assignee user ids per project, derived by walking
    // membership -> card -> board -> project (no raw SQL: reuses the same
    // qm.getByCardIds/getByBoardIds/getByProjectIds calls used elsewhere).
    const memberUserIdsByProjectId = {};
    cardMemberships.forEach((membership) => {
      const card = cardById[membership.cardId];
      const board = card && boardById[card.boardId];
      if (!board) {
        return;
      }

      if (!memberUserIdsByProjectId[board.projectId]) {
        memberUserIdsByProjectId[board.projectId] = new Set();
      }
      memberUserIdsByProjectId[board.projectId].add(membership.userId);
    });

    const relevantUserIds = _.uniq([
      ...sails.helpers.utils.mapRecords(cardMemberships, 'userId'),
      ...(ownerUser ? [ownerUser.id] : []),
    ]);
    const userById = _.keyBy(await User.qm.getByIds(relevantUserIds), 'id');

    let sentCount = 0;

    for (const { project, daysSilent, tier } of candidateProjects) {
      const recentNudge = (nudgesByProjectId[project.id] || []).some(
        (nudge) =>
          now.getTime() - new Date(nudge.sentAt).getTime() < DEDUP_WINDOW_DAYS * MS_PER_DAY,
      );

      if (recentNudge) {
        continue;
      }

      const memberUserIds = Array.from(memberUserIdsByProjectId[project.id] || []);

      let candidateRecipients;
      if (memberUserIds.length > 0) {
        candidateRecipients = memberUserIds.map((userId) => userById[userId]).filter(Boolean);
      } else if (ownerUser) {
        candidateRecipients = [ownerUser];
      } else {
        sails.log.warn(
          `[project-nudges] Project ${project.id} ("${project.name}") has no card assignees ` +
            'and no owner user exists — skipping.',
        );
        continue;
      }

      const dueRecipients = [];
      for (const recipient of candidateRecipients) {
        const isSnoozed = await ProjectSnooze.qm.isSnoozed(project.id, recipient.id);

        if (isSnoozed) {
          sails.log.info(
            `[project-nudges] Recipient ${recipient.id} (${recipient.email}) has snoozed ` +
              `project ${project.id} ("${project.name}") — skipping this recipient only.`,
          );
          continue;
        }

        dueRecipients.push(recipient);
      }

      if (dueRecipients.length === 0) {
        sails.log.info(
          `[project-nudges] Project ${project.id} ("${project.name}") — every candidate ` +
            'recipient has this project snoozed; no nudge sent, no row logged.',
        );
        continue;
      }

      const message = buildProjectNudgeMessage({ project, tier, daysSilent });

      const dispatchResults = await Promise.all(
        dueRecipients.map((recipient) => {
          sails.log.info(
            `[project-nudges] NUDGE — project=${project.id} ("${project.name}") ` +
              `recipient=${recipient.id} (${recipient.email}) daysSilent=${daysSilent} tier=${tier}`,
          );

          return sails.helpers.notificationDispatch.sendToRecipient(recipient, message, {
            projectId: project.id,
            projectName: project.name,
            daysSilent,
            tier,
          });
        }),
      );

      // One project_nudges row per project per nudge cycle, only once
      // dispatch actually succeeded for at least one recipient (see file
      // header) — not one per recipient, and not on total dispatch failure.
      if (dispatchResults.some((result) => result.dispatched)) {
        await ProjectNudge.qm.createOne({
          projectId: project.id,
          sentAt: now.toISOString(),
        });

        sentCount += 1;
      } else {
        sails.log.warn(
          `[project-nudges] Project ${project.id} ("${project.name}") — dispatch failed for ` +
            'every recipient; no project_nudges row logged (will retry next run).',
        );
      }
    }

    sails.log.info(
      `[project-nudges] Scan complete. Evaluated ${candidateProjects.length} stale project(s), ` +
        `sent ${sentCount} nudge(s).`,
    );

    return { evaluated: candidateProjects.length, sent: sentCount };
  },
};
