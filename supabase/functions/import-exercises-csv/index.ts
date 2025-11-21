import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportStats {
  total: number;
  inserted: number;
  updated: number;
  errors: number;
  errorDetails: Array<{ line: number; error: string; data?: any }>;
  processingTime: number;
}

interface ExerciseRow {
  exercise_id: string;
  name: string;
  exercise_type: string;
  exercise_group: string;
  level?: string;
  equipment?: string;
  primary_muscle?: string;
  secondary_muscle?: string;
  impact_level?: string;
  biomechanical_class?: string;
  dominant_movement?: string;
  video_url?: string;
  thumbnail_url?: string;
  contraindication?: string;
  short_description?: string;
  long_description?: string;
  variations?: string;
  suggested_methods?: string;
  suggested_volume?: string;
  tags?: string;
  difficulty_progression?: string;
  common_mistakes?: string;
  coaching_cues?: string;
  target_audience?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      throw new Error('Forbidden: Admin access required');
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File too large (max 10MB)');
    }

    // Read and parse CSV
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    // Remove BOM if present
    const header = lines[0].replace(/^\uFEFF/, '');
    const headers = header.split(';').map(h => h.trim());

    console.log('CSV Headers:', headers);

    const stats: ImportStats = {
      total: lines.length - 1,
      inserted: 0,
      updated: 0,
      errors: 0,
      errorDetails: [],
      processingTime: 0
    };

    // Helper functions
    const splitAndClean = (value: string | undefined, separator = ';'): string[] => {
      if (!value || value.trim() === '') return [];
      return value
        .split(separator)
        .map(item => item.trim())
        .filter(item => item !== '');
    };

    const cleanUrl = (url: string | undefined): string | null => {
      if (!url || url.trim() === '') return null;
      const cleaned = url.trim();
      if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        return null;
      }
      return cleaned;
    };

    const parseRow = (line: string, lineNumber: number): ExerciseRow | null => {
      try {
        // Split by semicolon but handle quoted fields
        const values = line.split(';').map(v => v.trim());
        
        const getVal = (colName: string): string | undefined => {
          const index = headers.indexOf(colName);
          return index >= 0 ? values[index] : undefined;
        };

        const exerciseId = getVal('exercise_id');
        const name = getVal('name');
        const exerciseType = getVal('exercise_type');
        const exerciseGroup = getVal('exercise_group');

        if (!exerciseId || !name || !exerciseType || !exerciseGroup) {
          throw new Error('Missing required fields: exercise_id, name, exercise_type, or exercise_group');
        }

        return {
          exercise_id: exerciseId,
          name,
          exercise_type: exerciseType,
          exercise_group: exerciseGroup,
          level: getVal('level'),
          equipment: getVal('equipment'),
          primary_muscle: getVal('primary_muscle'),
          secondary_muscle: getVal('secondary_muscle'),
          impact_level: getVal('impact_level'),
          biomechanical_class: getVal('biomechanical_class'),
          dominant_movement: getVal('dominant_movement'),
          video_url: getVal('video_url'),
          thumbnail_url: getVal('thumbnail_url'),
          contraindication: getVal('contraindication'),
          short_description: getVal('short_description'),
          long_description: getVal('long_description'),
          variations: getVal('variations'),
          suggested_methods: getVal('suggested_methods'),
          suggested_volume: getVal('suggested_volume'),
          tags: getVal('tags'),
          difficulty_progression: getVal('difficulty_progression'),
          common_mistakes: getVal('common_mistakes'),
          coaching_cues: getVal('coaching_cues'),
          target_audience: getVal('target_audience'),
        };
      } catch (error) {
        stats.errorDetails.push({
          line: lineNumber,
          error: error instanceof Error ? error.message : String(error),
          data: line.substring(0, 100)
        });
        return null;
      }
    };

    // Process rows
    for (let i = 1; i < lines.length; i++) {
      const row = parseRow(lines[i], i + 1);
      
      if (!row) {
        stats.errors++;
        continue;
      }

      try {
        // Check if exercise exists
        const { data: existing } = await supabase
          .from('exercises')
          .select('id')
          .eq('exercise_id', row.exercise_id)
          .single();

        const exerciseData = {
          exercise_id: row.exercise_id,
          name: row.name,
          exercise_type: row.exercise_type as any,
          exercise_group: row.exercise_group as any,
          level: row.level || null,
          equipment: splitAndClean(row.equipment, '/'),
          primary_muscle: row.primary_muscle || null,
          secondary_muscle: row.secondary_muscle || null,
          impact_level: row.impact_level || null,
          biomechanical_class: row.biomechanical_class || null,
          dominant_movement: row.dominant_movement || null,
          video_url: cleanUrl(row.video_url),
          thumbnail_url: cleanUrl(row.thumbnail_url),
          contraindication: row.contraindication || null,
          short_description: row.short_description || null,
          long_description: row.long_description || null,
          variations: splitAndClean(row.variations),
          suggested_methods: splitAndClean(row.suggested_methods, ','),
          suggested_volume: row.suggested_volume ? { name: row.suggested_volume } : null,
          tags: splitAndClean(row.tags, ','),
          difficulty_progression: row.difficulty_progression 
            ? row.difficulty_progression.split('|').map(p => p.trim()).filter(p => p)
            : [],
          common_mistakes: splitAndClean(row.common_mistakes, ','),
          coaching_cues: splitAndClean(row.coaching_cues, ','),
          target_audience: splitAndClean(row.target_audience, ','),
          is_new: false,
          review_status: 'approved',
          source_reference: 'CSV Import Master v6',
          confidence_score: 100,
          updated_at: new Date().toISOString()
        };

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('exercises')
            .update(exerciseData)
            .eq('id', existing.id);

          if (error) throw error;
          stats.updated++;
        } else {
          // Insert new
          const { error } = await supabase
            .from('exercises')
            .insert({
              ...exerciseData,
              created_at: new Date().toISOString(),
              created_by: null
            });

          if (error) throw error;
          stats.inserted++;
        }

        console.log(`Processed ${i}/${stats.total}: ${row.name} (${existing ? 'updated' : 'inserted'})`);
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        stats.errors++;
        stats.errorDetails.push({
          line: i + 1,
          error: error instanceof Error ? error.message : String(error),
          data: row
        });
      }
    }

    stats.processingTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        message: `Import completed: ${stats.inserted} inserted, ${stats.updated} updated, ${stats.errors} errors`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
