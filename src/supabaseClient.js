import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://lbvvikesrysqaqplysgy.supabase.co"
const supabaseAnonKey = "sb_publishable_z_D5M1BjGNmITvCS3IXOaA_gYE5UOW6"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)