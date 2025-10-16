import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import nodemailer from 'npm:nodemailer@6.9.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { accountId, to, subject, text, html } = await req.json();

    if (!to || !subject) {
      throw new Error('Missing required fields: to, subject');
    }

    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .maybeSingle();

    if (accountError || !account) {
      throw new Error('Account not found');
    }

    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: account.smtp_secure,
      auth: {
        user: account.smtp_username,
        pass: account.smtp_password,
      },
    });

    const info = await transporter.sendMail({
      from: account.email,
      to,
      subject,
      text,
      html,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: info.messageId 
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});