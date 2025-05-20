import Agenda from "agenda";
import User from "../models/User.js";
import ScheduleReminderJob from "../helpers/ScheduleReminderJob.js";
import {
  LearningReminderEmail,
  LearningReminderNotification,
} from "./NotificationReminderService.js";

const AgendaSetup = (mongoConnectionString: string) => {
  const agenda = new Agenda({
    db: { address: mongoConnectionString, collection: "AgendaJobs" },
    processEvery: "30 seconds",
    maxConcurrency: Number.MAX_SAFE_INTEGER,
  });

  //   agenda.defaultConcurrency(5);
  agenda.defaultLockLifetime(10000);

  // Clean up completed jobs older than 24 hours
  //   agenda.define("cleanup old jobs", async (job: any) => {
  //     await agenda.cancel({
  //       lastFinishedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  //     });
  //   });

  agenda.define("send learning reminder", async (job: any) => {
    const { userId } = job.attrs.data;

    try {
      // Get user and reminder data
      const user = await User.findById(userId);
      //   const reminder = await Reminder.findById(reminderId);

      if (!user || user.learningReminder === false) {
        return;
      }

      // Check user notification preferences
      if (user.notificationPreferences?.email) {
        await LearningReminderEmail({
          email: user.email,
          fullName: user.fullName,
        });
      }

      if (
        user.notificationPreferences?.inApp &&
        user.deviceTokens!.length > 0
      ) {
        for (const token of user.deviceTokens!) {
          await LearningReminderNotification(token, user.fullName);
        }
      }

      // Update the last sent date
      //   reminder.lastSent = new Date();
      //   await reminder.save();
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  });

  // Schedule all active reminders
  agenda.define("schedule all reminders", async () => {
    try {
      // Cancel all existing reminder jobs before rescheduling
      await agenda.cancel({ name: "send learning reminder" });

      const users = await User.find({ accountClosed: false });

      // Fixed reminder schedule - could be stored in a config
      const defaultSchedule = [
        { day: "Monday", time: "Morning" },
        { day: "Wednesday", time: "Afternoon" },
        { day: "Friday", time: "Evening" },
        // Add more default schedules as needed
      ];

      for (const user of users) {
        // Create a "virtual" reminder object with the default schedule
        const reminderData = {
          userId: user._id,
          //   _id: user._id, // Use user ID as reminder ID for simplicity
          frequency: defaultSchedule,
        };

        await ScheduleReminderJob(agenda, reminderData);
      }
    } catch (error) {
      console.error("Error scheduling reminders:", error);
    }
  });

  // Start the agenda process
  (async function () {
    await agenda.start();

    // Schedule reminder setup to run on startup and then daily
    // await agenda.now("schedule all reminders");

    // Schedule the cleanup job to run daily
    await agenda.every("24 hours", "cleanup old jobs");

    console.log("Agenda started with job cleanup scheduling");
  })();

  return agenda;
};

export { AgendaSetup };
