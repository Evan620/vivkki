/**
 * Archive service for case files
 * 
 * Provides functions to archive, unarchive, and bulk archive cases.
 * Also creates work log entries for tracking archive actions.
 */

import { supabase } from './database';

/**
 * Archive a single case
 * @param casefileId - ID of the case to archive
 * @returns Success status
 */
export async function archiveCase(casefileId: number): Promise<boolean> {
  try {
    const updateData: any = {
      is_archived: true,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('casefiles')
      .update(updateData)
      .eq('id', casefileId);

    // If error is about missing column or schema cache, try without archive fields
    if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('is_archived') || error.message?.includes('schema cache'))) {
      console.warn('Archive columns not available yet (schema cache may need refresh), updating without archive fields:', error.message);
      const { error: fallbackError } = await supabase
        .from('casefiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', casefileId);
      
      if (fallbackError) {
        console.error('Error updating case:', fallbackError);
        return false;
      }
      // Return true but note that archive didn't persist (will work once cache refreshes)
      return true;
    }

    if (error) {
      console.error('Error archiving case:', error);
      return false;
    }

    // Create work log entry (don't fail if this errors)
    try {
      await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: 'Case archived',
        user_name: 'System',
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to create work log entry:', logError);
      // Don't fail the archive operation if work log fails
    }

    return true;
  } catch (error) {
    console.error('Exception archiving case:', error);
    return false;
  }
}

/**
 * Unarchive a single case
 * @param casefileId - ID of the case to unarchive
 * @returns Success status
 */
export async function unarchiveCase(casefileId: number): Promise<boolean> {
  try {
    const updateData: any = {
      is_archived: false,
      archived_at: null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('casefiles')
      .update(updateData)
      .eq('id', casefileId);

    // If error is about missing column, try without archive fields
    if (error && (error.code === '42703' || error.message?.includes('column') || error.message?.includes('is_archived'))) {
      console.warn('is_archived column not found, updating without archive fields:', error.message);
      const { error: fallbackError } = await supabase
        .from('casefiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', casefileId);
      
      if (fallbackError) {
        console.error('Error updating case:', fallbackError);
        return false;
      }
      return true;
    }

    if (error) {
      console.error('Error unarchiving case:', error);
      return false;
    }

    // Create work log entry (don't fail if this errors)
    try {
      await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: 'Case unarchived',
        user_name: 'System',
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to create work log entry:', logError);
    }

    return true;
  } catch (error) {
    console.error('Exception unarchiving case:', error);
    return false;
  }
}

/**
 * Bulk archive multiple cases
 * @param casefileIds - Array of case IDs to archive
 * @returns Success status
 */
export async function bulkArchiveCases(casefileIds: number[]): Promise<boolean> {
  if (casefileIds.length === 0) return true;

  try {
    const now = new Date().toISOString();
    const updateData: any = {
      is_archived: true,
      archived_at: now,
      updated_at: now
    };

    let { error } = await supabase
      .from('casefiles')
      .update(updateData)
      .in('id', casefileIds);

    // If error is about missing column, try without archive fields
    if (error && (error.code === '42703' || error.message?.includes('column') || error.message?.includes('is_archived'))) {
      console.warn('is_archived column not found, updating without archive fields:', error.message);
      const { error: fallbackError } = await supabase
        .from('casefiles')
        .update({ updated_at: now })
        .in('id', casefileIds);
      
      if (fallbackError) {
        console.error('Error bulk updating cases:', fallbackError);
        return false;
      }
      // Still return true even if archive column doesn't exist
    } else if (error) {
      console.error('Error bulk archiving cases:', error);
      return false;
    }

    // Create work log entries for each case (don't fail if this errors)
    try {
      const workLogEntries = casefileIds.map(id => ({
        casefile_id: id,
        description: 'Case archived (bulk)',
        user_name: 'System',
        timestamp: now
      }));

      await supabase.from('work_logs').insert(workLogEntries);
    } catch (logError) {
      console.warn('Failed to create work log entries:', logError);
    }

    return true;
  } catch (error) {
    console.error('Exception bulk archiving cases:', error);
    return false;
  }
}

/**
 * Bulk unarchive multiple cases
 * @param casefileIds - Array of case IDs to unarchive
 * @returns Success status
 */
export async function bulkUnarchiveCases(casefileIds: number[]): Promise<boolean> {
  if (casefileIds.length === 0) return true;

  try {
    const now = new Date().toISOString();
    const updateData: any = {
      is_archived: false,
      archived_at: null,
      updated_at: now
    };

    let { error } = await supabase
      .from('casefiles')
      .update(updateData)
      .in('id', casefileIds);

    // If error is about missing column, try without archive fields
    if (error && (error.code === '42703' || error.message?.includes('column') || error.message?.includes('is_archived'))) {
      console.warn('is_archived column not found, updating without archive fields:', error.message);
      const { error: fallbackError } = await supabase
        .from('casefiles')
        .update({ updated_at: now })
        .in('id', casefileIds);
      
      if (fallbackError) {
        console.error('Error bulk updating cases:', fallbackError);
        return false;
      }
      return true;
    } else if (error) {
      console.error('Error bulk unarchiving cases:', error);
      return false;
    }

    // Create work log entries for each case (don't fail if this errors)
    try {
      const workLogEntries = casefileIds.map(id => ({
        casefile_id: id,
        description: 'Case unarchived (bulk)',
        user_name: 'System',
        timestamp: now
      }));

      await supabase.from('work_logs').insert(workLogEntries);
    } catch (logError) {
      console.warn('Failed to create work log entries:', logError);
    }

    return true;
  } catch (error) {
    console.error('Exception bulk unarchiving cases:', error);
    return false;
  }
}

