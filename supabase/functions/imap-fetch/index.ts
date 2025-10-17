import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Imap from 'npm:imap@0.8.19';
import { simpleParser } from 'npm:mailparser@3.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions?: any;
}

function connectImap(config: ImapConfig): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('Connecting to IMAP:', config.host, config.port);
    
    const imap = new Imap({
      ...config,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 5000,
    });
    
    imap.once('ready', () => {
      console.log('IMAP connection ready');
      resolve(imap);
    });
    
    imap.once('error', (err: any) => {
      console.error('IMAP connection error:', err);
      reject(err);
    });
    
    imap.connect();
  });
}

function openBox(imap: any, boxName: string, readOnly: boolean = true): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('Opening box:', boxName);
    imap.openBox(boxName, readOnly, (err: any, box: any) => {
      if (err) {
        console.error('Error opening box:', err);
        reject(err);
      } else {
        console.log('Box opened, total messages:', box.messages.total);
        resolve(box);
      }
    });
  });
}

function fetchMessages(imap: any, box: any, range: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const messages: any[] = [];
    
    if (box.messages.total === 0) {
      console.log('No messages in mailbox');
      resolve([]);
      return;
    }
    
    const start = Math.max(1, box.messages.total - 49);
    const end = box.messages.total;
    const actualRange = `${start}:${end}`;
    
    console.log('Fetching messages:', actualRange);
    
    const f = imap.seq.fetch(actualRange, {
      bodies: '',
      struct: true
    });
    
    f.on('message', (msg: any, seqno: number) => {
      console.log('Processing message #' + seqno);
      let buffer = '';
      
      msg.on('body', (stream: any) => {
        stream.on('data', (chunk: any) => {
          buffer += chunk.toString('utf8');
        });
      });
      
      msg.once('end', () => {
        messages.push(buffer);
      });
    });
    
    f.once('error', (err: any) => {
      console.error('Fetch error:', err);
      reject(err);
    });
    
    f.once('end', () => {
      console.log('Fetch complete, messages:', messages.length);
      resolve(messages);
    });
  });
}

function getBoxes(imap: any): Promise<any> {
  return new Promise((resolve, reject) => {
    imap.getBoxes((err: any, boxes: any) => {
      if (err) reject(err);
      else resolve(boxes);
    });
  });
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

    const { accountId, action, folder, range } = await req.json();
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

    const imapConfig: ImapConfig = {
      user: account.imap_username,
      password: account.imap_password,
      host: account.imap_host,
      port: account.imap_port,
      tls: true,
    };

    const imap = await connectImap(imapConfig);

    let result;

    if (action === 'listFolders') {
      const boxes = await getBoxes(imap);
      result = { boxes };
    } else if (action === 'fetchMessages') {
      const box = await openBox(imap, folder || 'INBOX');
      const rawMessages = await fetchMessages(imap, box, range || '1:50');
      
      console.log('Parsing messages...');
      const parsedMessages = await Promise.all(
        rawMessages.map(async (raw) => {
          try {
            const parsed = await simpleParser(raw);
            return {
              from: parsed.from?.text || '',
              to: parsed.to?.text || '',
              subject: parsed.subject || '(Sans objet)',
              date: parsed.date || new Date(),
              text: parsed.text || '',
              html: parsed.html || '',
            };
          } catch (err) {
            console.error('Error parsing message:', err);
            return null;
          }
        })
      );
      
      result = { messages: parsedMessages.filter(m => m !== null) };
      console.log('Returning', result.messages.length, 'messages');
    } else {
      throw new Error('Invalid action');
    }

    imap.end();

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