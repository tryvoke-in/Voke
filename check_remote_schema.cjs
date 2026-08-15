const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data: postsData, error: postsErr } = await supabase
    .from('posts')
    .select('id, title, post_type')
    .limit(1);
    
  console.log('posts:', postsData, postsErr);

  const { data: feedData, error: feedErr } = await supabase
    .from('community_feed')
    .select('id, title, like_count, comment_count')
    .limit(1);
    
  console.log('community_feed:', feedData, feedErr);

  const { data: solvedData, error: solvedErr } = await supabase
    .from('solved_questions')
    .select('*')
    .limit(1);
    
  console.log('solved_questions:', solvedData, solvedErr);
}

checkSchema();
