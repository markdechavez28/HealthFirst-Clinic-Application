import React from "react";

export function ChooseTime({ onNext, onBack, selectedDate, setSelectedDate, selectedTime, setSelectedTime }) {
  
  const times = [
    "09:00 AM", "09:30 AM", "10:00 AM",
    "10:30 AM", "11:00 AM", "11:30 AM",
    "01:00 PM", "01:30 PM", "02:00 PM",
    "02:30 PM", "03:00 PM", "03:30 PM"
  ];

  // Generate available dates (next 14 days)
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const availableDates = generateDates();

  const formatDateLabel = (date) => {
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate();
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return `${dayName}, ${month} ${day}`;
    }
  };

  const formatDateValue = (date) => {
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-extrabold text-slate-900 mb-4">Choose a Time</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar Dates */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {availableDates.map((date) => {
            const dateValue = formatDateValue(date);
            const label = formatDateLabel(date);
            
            return (
              <button
                key={dateValue}
                onClick={() => setSelectedDate(dateValue)}
                className={
                  "w-full px-4 py-3 text-left font-semibold text-slate-700 hover:bg-sky-100 border " +
                  (selectedDate === dateValue ? "border-hf-blue bg-sky-100" : "border-slate-200 bg-white")
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Time Slots */}
        <div className="md:col-span-2">
          <div className="text-sm font-semibold text-slate-600 mb-3">
            Available time slots
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {times.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={
                  "px-3 py-2 font-semibold text-slate-800 hover:bg-sky-200 border " +
                  (selectedTime === t ? "bg-hf-blue text-white border-hf-blue" : "bg-sky-100 border-slate-200")
                }
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onBack}
              className="w-full border border-slate-200 bg-white py-3 font-bold text-slate-700 hover:bg-slate-50"
            >
              ← Back
            </button>
            <button
              onClick={onNext}
              className="w-full bg-hf-blue py-3 font-bold text-white hover:bg-blue-600"
            >
              Continue to Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
