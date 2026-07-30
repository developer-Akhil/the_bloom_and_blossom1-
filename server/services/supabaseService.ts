import { createClient } from "@supabase/supabase-js";
import { config } from "../config/config.js";

// Ensure keys are valid before throwing "Invalid API key" from the library
let supabase: ReturnType<typeof createClient>;

const isPlaceholder = (val: string) => !val || val.includes("YOUR_");

if (isPlaceholder(config.supabase.url) || isPlaceholder(config.supabase.key)) {
  console.warn("⚠️ Supabase initialization warning: Supabase credentials are not configured or are using placeholders.");
  
  const throwError = () => {
     throw new Error("Supabase is not configured. Please add SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL to your variables.");
  };

  const dummyChain: any = new Proxy(Function, {
    apply: () => dummyChain,
    get: (target, prop) => {
      if (prop === 'then') {
         return (resolve: any, reject: any) => {
             reject(new Error("Supabase is not configured. Please add SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL to your AI Studio variable settings."));
         };
      }
      return dummyChain;
    }
  });

  supabase = dummyChain;
} else {
  try {
    supabase = createClient(config.supabase.url, config.supabase.key);
  } catch (error: any) {
    console.warn("⚠️ Supabase initialization warning:", error.message);
    supabase = new Proxy({} as any, {
      get() {
        return () => {
          throw new Error("Supabase couldn't be initialized correctly. Please check your credentials.");
        }
      }
    });
  }
}

export { supabase };
