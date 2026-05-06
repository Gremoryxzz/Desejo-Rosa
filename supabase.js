// conexão com Supabase

const supabaseUrl = "https://fqsqkwcqqmfbpemftotj.supabase.co";
const supabaseKey = "sb_publishable_YoqDmooOrQKK2TohHd6kuA_pk68MTcW";

// ⚠️ usa outro nome pra não conflitar com a lib
const client = window.supabase.createClient(supabaseUrl, supabaseKey);

// deixa global (igual Firebase)
window.db = client;