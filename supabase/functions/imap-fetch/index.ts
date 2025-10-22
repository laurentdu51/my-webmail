import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function connectIMAP(host: string, port: number, username: string, password: string) {
  const conn = await Deno.connect({
    hostname: host,
    port: port,
    transport: 'tcp',
  });

  const tls = await Deno.startTls(conn, {
    hostname: host,
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function readResponse(): Promise<string> {
    const buffer = new Uint8Array(65536);
    const n = await tls.read(buffer);
    if (n === null) return '';
    return decoder.decode(buffer.subarray(0, n));
  }

  async function sendCommand(command: string): Promise<string> {
    await tls.write(encoder.encode(command + '\r\n'));
    return await readResponse();
  }

  const greeting = await readResponse();
  console.log('Server greeting:', greeting);

  const loginResp = await sendCommand(`A001 LOGIN "${username}" "${password}"`);
  console.log('Login response:', loginResp);

  if (!loginResp.includes('A001 OK')) {
    throw new Error('Login failed: ' + loginResp);
  }

  return { tls, sendCommand, readResponse, close: () => tls.close() };
}

async function fetchIMAPMessages(connection: any, folder: string = 'INBOX'): Promise<any[]> {
  const selectResp = await connection.sendCommand(`A002 SELECT "${folder}"`);
  console.log('Select response:', selectResp);

  if (!selectResp.includes('A002 OK')) {
    throw new Error('Failed to select folder: ' + selectResp);
  }

  const totalMatch = selectResp.match(/\* (\d+) EXISTS/);
  const total = totalMatch ? parseInt(totalMatch[1]) : 0;

  if (total === 0) {
    return [];
  }

  const start = Math.max(1, total - 49);
  const end = total;

  const fetchResp = await connection.sendCommand(`A003 FETCH ${start}:${end} (BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE)] BODY.PEEK[TEXT])`);
  console.log('Fetch response length:', fetchResp.length);

  const messages = parseFetchResponse(fetchResp);
  return messages;
}

function parseFetchResponse(response: string): any[] {
  const messages: any[] = [];
  const lines = response.split('\r\n');

  let currentMessage: any = null;
  let inHeaders = false;
  let inBody = false;
  let bodyText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/^\* \d+ FETCH/)) {
      if (currentMessage) {
        currentMessage.text = bodyText.trim();
        messages.push(currentMessage);
      }
      currentMessage = { from: '', to: '', subject: '', date: new Date(), text: '', html: '' };
      bodyText = '';
      inHeaders = true;
      inBody = false;
    } else if (line.includes('BODY[TEXT]')) {
      inHeaders = false;
      inBody = true;
    } else if (inHeaders) {
      if (line.toLowerCase().startsWith('from:')) {
        currentMessage.from = line.substring(5).trim();
      } else if (line.toLowerCase().startsWith('to:')) {
        currentMessage.to = line.substring(3).trim();
      } else if (line.toLowerCase().startsWith('subject:')) {
        currentMessage.subject = line.substring(8).trim() || '(Sans objet)';
      } else if (line.toLowerCase().startsWith('date:')) {
        try {
          currentMessage.date = new Date(line.substring(5).trim());
        } catch {
          currentMessage.date = new Date();
        }
      }
    } else if (inBody && !line.startsWith('A003') && line.trim()) {
      bodyText += line + '\n';
    }
  }

  if (currentMessage && !messages.includes(currentMessage)) {
    currentMessage.text = bodyText.trim();
    messages.push(currentMessage);
  }

  return messages;
}

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

    const { accountId, action, folder } = await req.json();
    console.log('Request:', { accountId, action, folder });

    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .maybeSingle();

    if (accountError || !account) {
      console.error('Account error:', accountError);
      throw new Error('Account not found');
    }

    console.log('Connecting to IMAP:', account.imap_host, account.imap_port);

    const connection = await connectIMAP(
      account.imap_host,
      account.imap_port,
      account.imap_username,
      account.imap_password
    );

    let result;

    if (action === 'listFolders') {
      result = { boxes: { INBOX: {}, Sent: {}, Drafts: {}, Trash: {}, Spam: {} } };
    } else if (action === 'fetchMessages') {
      const messages = await fetchIMAPMessages(connection, folder || 'INBOX');
      result = { messages };
      console.log('Returning', messages.length, 'messages');
    } else {
      throw new Error('Invalid action');
    }

    connection.close();

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
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
