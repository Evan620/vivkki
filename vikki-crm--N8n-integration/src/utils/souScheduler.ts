/**
 * SOU Scheduler - Internal Cron Job
 * 
 * Automatically generates State of the Union reports on a weekly schedule
 */

import { generateSOU } from '../services/souService';

const STORAGE_KEY = 'sou_last_generation';
const WEEKLY_SCHEDULE_DAY = 1; // Monday (0 = Sunday, 1 = Monday, etc.)
const WEEKLY_SCHEDULE_HOUR = 9; // 9 AM

/**
 * Check if SOU should be generated this week
 */
function shouldGenerateThisWeek(): boolean {
  const lastGeneration = localStorage.getItem(STORAGE_KEY);
  
  if (!lastGeneration) {
    return true; // Never generated, generate now
  }

  const lastDate = new Date(lastGeneration);
  const now = new Date();
  
  // Check if it's been at least 7 days
  const daysSinceLastGeneration = Math.floor(
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceLastGeneration >= 7;
}

/**
 * Check if current time matches scheduled day and hour
 */
function isScheduledTime(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();

  return dayOfWeek === WEEKLY_SCHEDULE_DAY && hour === WEEKLY_SCHEDULE_HOUR;
}

/**
 * Generate SOU if scheduled
 */
async function checkAndGenerateSOU(): Promise<void> {
  try {
    // Check if it's the scheduled day/time
    if (!isScheduledTime()) {
      return;
    }

    // Check if already generated this week
    if (!shouldGenerateThisWeek()) {
      console.log('📊 SOU already generated this week, skipping...');
      return;
    }

    console.log('📊 Generating weekly SOU report...');
    const result = await generateSOU();

    if (result.success) {
      // Store generation timestamp
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      console.log('✅ Weekly SOU generation complete');
    } else {
      console.error('❌ Failed to generate weekly SOU:', result.error);
    }
  } catch (error) {
    console.error('❌ Error in SOU scheduler:', error);
  }
}

/**
 * Initialize SOU scheduler
 * Checks every hour if it's time to generate SOU
 */
export function initializeSOUScheduler(): () => void {
  console.log('📅 Initializing SOU scheduler...');

  // Check immediately on initialization
  checkAndGenerateSOU();

  // Check every hour
  const intervalId = setInterval(() => {
    checkAndGenerateSOU();
  }, 60 * 60 * 1000); // 1 hour

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.log('📅 SOU scheduler stopped');
  };
}

/**
 * Force generate SOU (for manual testing)
 */
export async function forceGenerateSOU(): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  const result = await generateSOU();
  
  if (result.success) {
    // Update last generation timestamp
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  }
  
  return result;
}


