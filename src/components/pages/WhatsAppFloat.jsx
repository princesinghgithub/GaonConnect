import React from "react";
import { trackEvent } from "../../utils/analytics";

const WhatsAppFloat = () => {
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