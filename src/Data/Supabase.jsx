import { createClient } from "@supabase/supabase-js"

const apikey ="https://kttchqqxrlimdljrawbi.supabase.co"
const anonkey ="sb_publishable_xHnusD8QNxRNHnTeZkJK5A_HumMSKfT"
export const supabase = createClient(apikey,anonkey)