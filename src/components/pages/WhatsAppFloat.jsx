import React from "react";
import { trackEvent } from "../../utils/analytics";
import { useAuth } from "../../context/AuthContext";

const WhatsAppFloat = () => {
  const { isAuthenticated } = useAuth();

  // Logged-in user ko in-app support chat milti hai — us par WhatsApp bhi
  // dikhane se do floating buttons ek doosre pe chadh jaate hain. Logged-out
  // visitor ke paas chat nahi hai (endpoint login ke peeche hai), isliye unke
  // liye WhatsApp hi rasta hai.
  if (isAuthenticated) return null;

  return (
    <a
      href="https://wa.me/916260132613?text=Hello%20GaonConnect%20Support"
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('whatsapp_click', { source: 'floating_button' })}
    >
      <img src="/whatsapp.png" alt="WhatsApp Chat" className="whatsapp-icon" />
    </a>
  );
};

export default WhatsAppFloat;