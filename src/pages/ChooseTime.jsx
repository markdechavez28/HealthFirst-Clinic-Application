import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function ChooseTime({ doctor, onNext, onBack }) {
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (doctor) fetchSchedule();
  }, [doctor]);

  const fetchSchedule = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("Schedule")
      .select("*")
      .eq("doctorID", doctor.doctorID)
      .eq("is_available", true)
      .gte("available_date", today)
      .order("available_date", { ascending: true });

    if (!error) setSchedules(data);
    else console.error(error);
  };

  // Group by date
  const uniqueDates = [...new Set(schedules.map(s => s.available_date))];

  // Filter slots by selectedDate
  const filteredSlots = schedules.filter(
    s => s.available_date === selectedDate
  );

  return (
    <div className="p-6">
      <h2 className="text-xl font-extrabold text-slate-900 mb-4">
        Choose a Time
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dates */}
        <div className="space-y-2">
          {uniqueDates.map(date => (
            <button
              key={date}
              onClick={() => {
                setSelectedDate(date);
                setSelectedSlot(null);
              }}
              className={
                "w-full rounded-lg border px-4 py-3 font-semibold " +
                (selectedDate === date ? "bg-hf-blue text-white" : "bg-white hover:bg-sky-100")
              }
            >
              {date}
            </button>
          ))}
        </div>

        {/* Time Slots */}
        <div className="md:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredSlots.map(slot => (
              <button
                key={slot.scheduleID}
                onClick={() => setSelectedSlot(slot)}
                className={
                  "rounded-lg px-3 py-2 font-semibold " +
                  (selectedSlot?.scheduleID === slot.scheduleID
                    ? "bg-hf-blue text-white"
                    : "bg-sky-100 hover:bg-sky-200")
                }
              >
                {slot.time_slot}
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={onBack} className="w-full border py-3">
              ← Back
            </button>
            <button
              disabled={!selectedSlot}
              onClick={() => onNext(selectedSlot)}
              className="w-full bg-hf-blue text-white py-3 disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
