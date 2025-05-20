import Agenda from "agenda";

const ScheduleReminderJob = async (agenda: Agenda, reminder: any) => {
  // const { userId, _id: reminderId, frequency } = reminder;
  const { userId, frequency } = reminder;

  // Define time mappings for the preset times shown in UI
  const timeMappings: Record<string, { hour: number; minute: number }> = {
    Morning: { hour: 9, minute: 0 },
    Afternoon: { hour: 12, minute: 0 },
    Evening: { hour: 19, minute: 0 },
  };

  const dayMap: Record<string | number, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
  };

  for (const entry of frequency) {
    const day = dayMap[entry.day];

    // Handle both string-based time values from UI and direct hour/minute objects
    let hour, minute;

    if (typeof entry.time === "string") {
      // Handle string-based time values (e.g., "Morning", "Afternoon")
      const timeMapping = timeMappings[entry.time];
      if (!timeMapping) {
        console.error(`Unknown time value: ${entry.time}`);
        continue;
      }
      hour = timeMapping.hour;
      minute = timeMapping.minute;
    } else if (entry.time && typeof entry.time === "object") {
      // Handle direct hour/minute objects
      hour = entry.time.hour;
      minute = entry.time.minute ?? 0; // default 0 if undefined
    } else {
      console.error(`Invalid time format: ${JSON.stringify(entry.time)}`);
      continue;
    }

    // Access hour and minute from entry.time object
    // const hour = entry.time.hour;
    // const minute = entry.time.minute ?? 0; // default 0 if undefined

    const cronExpression = `${minute} ${hour} * * ${day}`;

    await agenda.every(cronExpression, "send learning reminder", {
      userId,
      // reminderId,
      day,
      hour,
      minute,
    });
  }
};

export default ScheduleReminderJob;
