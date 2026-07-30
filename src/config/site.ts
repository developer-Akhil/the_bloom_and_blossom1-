const API_BASE_URL = import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL !== "https://bloomandblossom.in" ? import.meta.env.VITE_API_BASE_URL : "";
const APP_URL = import.meta.env.VITE_APP_URL || "https://bloomandblossom.in";

export const siteConfig = {
  name: "The Bloom & Blossom",
  description: "Hand-crafted hair accessories designed to bring out the blooming beauty in every person. Delicate, elegant, and uniquely yours.",
  url: APP_URL,
  contact: {
    email: "info@bloomandblossom.in",
    phone: "+91 8076323737",
    phoneDisplay: "+91 8076323737", // If we want to format it differently
    address: {
      line1: "Shivlok Colony Haridwar",
      line2: "Uttarakhand 249403",
    }
  },
  social: {
    instagram: "https://www.instagram.com/bows_scrunchies.love/",
    instagramHandle: "@bloomandblossom.official",
    youtube: "https://www.youtube.com/@thebloomandblossom",
    facebook: "https://www.facebook.com/share/1GMNfXQki9/",
    whatsapp: "https://wa.me/message/6IMAWM55WUTII1"
  },
  api: {
    payment: {
      createOrder: `${API_BASE_URL}/api/payment/create-order`,
      verifyPayment: `${API_BASE_URL}/api/payment/verify-payment`,
      refund: `${API_BASE_URL}/api/payment/refund`,
      webhook: `${API_BASE_URL}/api/payment/webhook`
    },
    contact: {
      orderConfirmation: `${API_BASE_URL}/api/contact/order-confirmation`
    }
  }
};
