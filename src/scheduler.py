"""Scheduler — runs the Music Weekly FR agent every Friday."""

from __future__ import annotations

import logging
import signal
import sys
import time

import schedule

from config.settings import LOG_FORMAT, LOG_LEVEL, SCHEDULE_DAY, SCHEDULE_TIME
from src.agent import MusicWeeklyAgent

logging.basicConfig(level=LOG_LEVEL, format=LOG_FORMAT)
logger = logging.getLogger("Scheduler")


def run_agent():
    """Execute the agent and handle errors gracefully."""
    try:
        logger.info("Lancement programme du vendredi...")
        agent = MusicWeeklyAgent()
        paths = agent.run()
        logger.info("Newsletter generee: %s", paths)
    except Exception as e:
        logger.error("Erreur lors de l'execution: %s", e, exc_info=True)


def setup_schedule():
    """Configure the weekly Friday schedule."""
    # Schedule for every Friday at the configured time
    getattr(schedule.every(), SCHEDULE_DAY).at(SCHEDULE_TIME).do(run_agent)
    logger.info(
        "Planification configuree: chaque %s a %s",
        SCHEDULE_DAY,
        SCHEDULE_TIME,
    )


def handle_signal(signum, frame):
    """Graceful shutdown on SIGINT/SIGTERM."""
    logger.info("Arret du scheduler...")
    sys.exit(0)


def main():
    """Run the scheduler loop."""
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    logger.info("=== Music Weekly FR Scheduler ===")
    logger.info("L'agent sera execute chaque vendredi a %s (Europe/Paris)", SCHEDULE_TIME)
    logger.info("Ctrl+C pour arreter")

    # Option: run immediately if --now flag is passed
    if "--now" in sys.argv:
        logger.info("Flag --now detecte: execution immediate")
        run_agent()

    setup_schedule()

    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


if __name__ == "__main__":
    main()
