import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://lbvvikesrysqaqplysgy.supabase.co", "sb_publishable_z_D5M1BjGNmITvCS3IXOaA_gYE5UOW6");

async function run() {
  const { data, error } = await supabase
    .from("Appointment")
    .select("appointmentID, time_slot")
    .limit(1);

  if (data && data.length > 0) {
    const id = data[0].appointmentID;
    console.log("Found appointment", data[0]);

    // Test a fake update without really changing the date or doing something destructive
    // Or we just test if the type allows milliseconds or strings.
    // Instead of doing actual update, let me just try inserting a fake appointment
  }
}
run();
