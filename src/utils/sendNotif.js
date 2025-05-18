// utils/sendNotif.js
import emailjs from "emailjs-com";

const sendNotif = async ({ email, name, bookings }) => {
  const pendingBookings = bookings.filter(b => b.status === "pending");

  if (pendingBookings.length === 0) {
    console.log("No pending bookings to notify.");
    return;
  }

  const subject = "Pending Booking Notification from NeoCare";

  let message = `Hello, ${name},\n\nYou have pending booking(s) scheduled with NeoCare:\n\n`;

  pendingBookings.forEach((booking, index) => {
    const date = booking.date instanceof Date
  ? booking.date.toLocaleDateString()
  : new Date(booking.date).toLocaleDateString();

    message += `${index + 1}. ${booking.fullName} on ${date} at ${booking.hour} (${booking.platform})\n`;
  });

  message += `\nPlease follow up on your pending bookings;`;

  const templateParams = {
    subject,
    to_email: email,
    to_name: name,
    message,
  };

  try {
    await emailjs.send(
      "service_wmbofyj", // EmailJS Service ID
      "template_i1hctq8", // EmailJS Template ID
      templateParams,
      "OTKcxW7tWUSp9gqQH" // EmailJS Public Key
    );
  } catch (error) {
    console.error("Error sending booking notification:", error);
  }
};

export default sendNotif;