import React, { useState } from "react";

export default function BookingComponent({
  onClose,
  apiBase = "http://localhost:8000",
}) {
  const [doctor, setDoctor] = useState("Dr. Sharma (Eye Specialist)");
  const [purpose, setPurpose] = useState("General Checkup");
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const timings = {
    Morning: ["09:00 AM", "10:00 AM", "11:00 AM"],
    Afternoon: ["12:00 PM", "01:00 PM", "02:00 PM"],
    Evening: ["04:00 PM", "05:00 PM", "06:00 PM"]
  };

  const fieldStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #bae6fd",
    borderRadius: "14px",
    background: "#f8fcff",
    color: "#0c4a6e",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  const bookAppointment = async () => {
    if (!name || !phone || !date || !selectedSlot) {
      setStatusMessage("Please fill in all details before confirming.");
      return;
    }

    setSubmitting(true);
    setStatusMessage("");

    try {
      const response = await fetch(`${apiBase}/book-appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          date,
          time: selectedSlot,
          doctor,
          purpose
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatusMessage(
          data.detail || "Could not book the appointment. Please try again."
        );
        return;
      }

      setStatusMessage("Appointment booked successfully.");
      alert(`Appointment booked for ${date} at ${selectedSlot}`);
      onClose();
    } catch (error) {
      setStatusMessage(
        "Could not connect to the booking server. Please check that it is running."
      );
      console.error("Booking request failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "'DM Sans', sans-serif",
        color: "#0c4a6e",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
            Book Appointment
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#0369a1" }}>
            Choose a doctor, pick a slot, and confirm your visit.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: "none",
            background: "#e0f2fe",
            color: "#0369a1",
            borderRadius: "999px",
            width: 34,
            height: 34,
            cursor: "pointer",
            fontSize: 18,
            fontWeight: 700,
            flexShrink: 0,
          }}
          aria-label="Close booking form"
        >
          ×
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {statusMessage && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              background: "#eff6ff",
              color: "#1d4ed8",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {statusMessage}
          </div>
        )}

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
            Doctor
          </label>
          <select
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            style={fieldStyle}
          >
            <option>Dr. Sharma (Eye Specialist)</option>
            <option>Dr. Mehta (Cataract)</option>
            <option>Dr. Patil (Retina)</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
            Purpose
          </label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            style={fieldStyle}
          >
            <option>General Checkup</option>
            <option>Eye Surgery</option>
            <option>Vision Test</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div
          style={{
            background: "linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)",
            border: "1px solid #dbeafe",
            borderRadius: 18,
            padding: 14,
          }}
        >
          <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 700 }}>
            Available time slots
          </div>
        {Object.keys(timings).map((period) => (
          <div key={period} style={{ marginBottom: 12 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#0369a1" }}>
              {period}
            </h4>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {timings[period].map((time) => (
                <button
                  type="button"
                  key={time}
                  onClick={() => setSelectedSlot(time)}
                  style={{
                    padding: "9px 12px",
                    border: selectedSlot === time ? "1px solid #0284c7" : "1px solid #7dd3fc",
                    borderRadius: 999,
                    cursor: "pointer",
                    background: selectedSlot === time ? "linear-gradient(135deg, #0284c7, #0ea5e9)" : "white",
                    color: selectedSlot === time ? "white" : "#075985",
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: selectedSlot === time ? "0 8px 18px rgba(14,165,233,0.22)" : "none",
                  }}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        ))}
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
            Full name
          </label>
          <input
            placeholder="Enter patient name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
            Phone number
          </label>
          <input
            placeholder="Enter contact number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <button
          type="button"
          onClick={bookAppointment}
          disabled={submitting}
          style={{
            marginTop: 6,
            border: "none",
            borderRadius: 16,
            padding: "14px 16px",
            background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
            color: "white",
            fontSize: 15,
            fontWeight: 800,
            cursor: submitting ? "wait" : "pointer",
            opacity: submitting ? 0.7 : 1,
            boxShadow: "0 12px 28px rgba(14,165,233,0.24)",
          }}
        >
          {submitting ? "Confirming..." : "Confirm Appointment"}
        </button>
      </div>
    </div>
  );
}
