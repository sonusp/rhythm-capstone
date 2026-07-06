export const syncEventsToCalendar = async (accessToken, currentDay, userPrefs = {}) => {
  const { lifecycleMode = 'cycle', cycleLength = 28 } = userPrefs;
  
  const createEvent = async (summary, description, colorId, startDayOffset, endDayOffset) => {
    // Calculate dates based on current cycle day
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + startDayOffset);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + endDayOffset + 1); // +1 because end date is exclusive for all-day events

    const event = {
      summary: summary,
      description: description,
      colorId: colorId, // 11=red, 5=yellow
      start: {
        date: startDate.toISOString().split('T')[0]
      },
      end: {
        date: endDate.toISOString().split('T')[0]
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`Failed to create event: ${summary}`);
    }
  };

  // PREGNANCY MODE EXCEPTION
  if (lifecycleMode === 'pregnancy') {
    await createEvent(
      'Private: Prenatal Check-in',
      'Track symptoms and prioritize rest during this trimester.',
      '11',
      0,
      1
    );
    return true;
  }

  // POSTPARTUM MODE EXCEPTION
  if (lifecycleMode === 'postpartum') {
    await createEvent(
      'Private: Postpartum Recovery',
      'Focus on recovery, rest, and bonding. Track maternal symptoms.',
      '3',
      0,
      1
    );
    return true;
  }

  // STANDARD CYCLE LOGIC
  // Calculate offsets for Menstrual Phase (Days 1-5)
  const menstrualStartOffset = 1 - currentDay;
  const menstrualEndOffset = 5 - currentDay;
  
  // Ovulation Phase happens roughly 14 days before the end of the cycle.
  // So window is (cycleLength - 16) to (cycleLength - 12)
  const ovulationStartOffset = (cycleLength - 16) - currentDay;
  const ovulationEndOffset = (cycleLength - 12) - currentDay;
  
  // 1. Menstrual Phase (Color 11 is Red)
  // We ALWAYS sync this for cycle and childfree modes.
  await createEvent(
    'Private: Low Energy Window',
    'Predicted Menstrual Phase. Prioritize rest and iron-rich foods.',
    '11',
    menstrualStartOffset,
    menstrualEndOffset
  );

  // 2. Ovulation Phase (Color 5 is Yellow)
  // DO NOT sync for childfree mode (they don't want fertility tracking).
  if (lifecycleMode !== 'childfree') {
    await createEvent(
      'Private: Peak Fertility & Energy',
      'Predicted Ovulation Window. High energy and sociability.',
      '5',
      ovulationStartOffset,
      ovulationEndOffset
    );
  }
  
  return true;
};
