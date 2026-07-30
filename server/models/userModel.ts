import { supabase } from "../services/supabaseService.js";

// Database interactions for `app_users` table
// Table fields: id, email, password, isVerified, verificationToken, tokenExpiry, createdAt, updatedAt

const handleError = (error: any) => {
  if (error) {
    if (error.message?.includes("Invalid API key") || error.code === 'PGRST301') {
      throw new Error("Invalid API key: Please go to 'Project Settings > API' in Supabase. Copy 'Project URL' to 'VITE_SUPABASE_URL' and 'service_role' secret to 'SUPABASE_SERVICE_ROLE_KEY'.");
    }
    if (error.message?.includes("permission denied for schema")) {
      throw new Error("Schema permission denied: You must run the SQL in `supabase_schema.sql` at the root of your project in your Supabase SQL editor to create the schema and grant access to the service_role.");
    }
    if (error.message?.includes("column \"full_name\" of relation \"app_users\" does not exist") || error.message?.includes("column \"phone\" of relation \"app_users\" does not exist")) {
      throw new Error("Database schema out of date: Please run the SQL in `supabase_schema.sql` in your Supabase SQL Editor to add the full_name and phone columns to app_users.");
    }
    throw error;
  }
};

export const UserModel = {
  async createUser(userData: any) {
    const { data, error } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from("app_users")
      .insert([userData])
      .select()
      .single();

    handleError(error);
    return data;
  },

  async findByEmail(email: string) {
    const { data, error } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from("app_users")
      .select("*")
      .eq("email", email)
      .maybeSingle(); // returns null if no rows found

    handleError(error);
    return data;
  },

  async findByVerificationToken(hashedToken: string) {
    const { data, error } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from("app_users")
      .select("*")
      .eq("verificationToken", hashedToken)
      .maybeSingle();

    handleError(error);
    return data;
  },

  async updateUser(id: string, updates: any) {
    const { data, error } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from("app_users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    handleError(error);
    return data;
  }
};
