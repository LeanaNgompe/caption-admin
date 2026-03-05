import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnoseData() {
  const tables = ['captions', 'humor_flavors', 'llm_model_responses', 'llm_models', 'images', 'profiles']
  
  console.log('--- Database Diagnostics ---')
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      console.error(`Table "${table}" error:`, error.message, `(Code: ${error.code})`)
    } else {
      console.log(`Table "${table}": ${count} rows`)
    }
  }

  console.log('\n--- Captions Sample ---')
  const { data: caps, error: capErr } = await supabase.from('captions').select('id, content, humor_flavor_id, image_id').limit(3)
  console.log('Captions:', caps || capErr?.message)

  console.log('\n--- AI Model Performance Query Test ---')
  const { data: modelTest, error: modelErr } = await supabase
    .from('llm_model_responses')
    .select('model_id, llm_models(name), captions(like_count)')
    .limit(3)
  console.log('Model Performance Join:', modelTest || modelErr?.message)

  console.log('\n--- Humor Flavor Join Test ---')
  const { data: flavorTest, error: flavorErr } = await supabase
    .from('captions')
    .select('humor_flavor_id, humor_flavors(name)')
    .not('humor_flavor_id', 'is', null)
    .limit(3)
  console.log('Flavor Join:', flavorTest || flavorErr?.message)
}

diagnoseData()
