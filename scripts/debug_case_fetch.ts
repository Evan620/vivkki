
import { createClient } from '@supabase/supabase-js';

// Hardcoded for debugging to avoid dotenv issues
const supabaseUrl = 'https://ccodmcvkedntksmnhzqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjb2RtY3ZrZWRudGtzbW5oenFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDU1MDksImV4cCI6MjA3NTYyMTUwOX0._D2dHIP8wsK4bLNpiIs4qAV6a2WYRNQD3cdW9CBs5ew';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCaseList() {
    console.log(`Listing first 5 cases...`);

    const { data: cases, error } = await supabase
        .from('casefiles')
        .select('id, created_at')
        .limit(5);

    if (error) {
        console.error('List failed:', error);
        return;
    }

    console.log(`Found ${cases.length} cases.`);
    cases.forEach(c => {
        console.log(`ID: ${c.id} (Type: ${typeof c.id})`);
    });

    if (cases.length > 0) {
        const firstId = cases[0].id;
        console.log(`\nAttempting fetch for first ID: ${firstId}...`);

        const { data: singleCase, error: singleError } = await supabase
            .from('casefiles')
            .select('id')
            .eq('id', firstId)
            .single();

        if (singleError) {
            console.error('Fetch by ID failed:', singleError);
        } else {
            console.log('Fetch by ID successful!');
        }
    }
}

debugCaseList();
