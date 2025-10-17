import { supabase } from './supabase';

const IMAP_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/imap-fetch`;
const SMTP_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smtp-send`;

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  date: Date;
  text: string;
  html: string;
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchMessages(accountId: string, folder: string = 'INBOX', range: string = '1:50'): Promise<EmailMessage[]> {
  try {
    const headers = await getAuthHeaders();

    console.log('Fetching messages from:', IMAP_FUNCTION_URL);

    const response = await fetch(IMAP_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountId,
        action: 'fetchMessages',
        folder,
        range,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to fetch messages:', data);
      throw new Error(data.error || data.details || 'Failed to fetch messages');
    }

    console.log('Successfully fetched', data.messages?.length || 0, 'messages');
    return data.messages || [];
  } catch (error) {
    console.error('Error in fetchMessages:', error);
    throw error;
  }
}

export async function listFolders(accountId: string) {
  const headers = await getAuthHeaders();

  const response = await fetch(IMAP_FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      accountId,
      action: 'listFolders',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list folders');
  }

  const data = await response.json();
  return data.boxes;
}

export async function sendEmail(
  accountId: string,
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  const headers = await getAuthHeaders();

  const response = await fetch(SMTP_FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      accountId,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send email');
  }

  return await response.json();
}
