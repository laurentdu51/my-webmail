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
}

function connectImap(config: ImapConfig): Promise<any> {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    
    imap.once('ready', () => resolve(imap));
    imap.once('error', reject);
    
    imap.connect();
  });
}

function openBox(imap: any, boxName: string, readOnly: boolean = true): Promise<any> {
  return new Promise((resolve, reject) => {
    imap.openBox(boxName, readOnly, (err: any, box: any) => {
      if (err) reject(err);
      else resolve(box);
    });
  });
}

function fetchMessages(imap: any, range: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const messages: any[] = [];
    
    const f = imap.seq.fetch(range, {
      bodies: '',
      struct: true
    });
    
    f.on('message', (msg: any) => {
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
    
    f.once('error', reject);
    f.once('end', () => resolve(messages));
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

    const { data: account, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .maybeSingle();

    if (accountError || !account) {
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
      await openBox(imap, folder || 'INBOX');
      const rawMessages = await fetchMessages(imap, range || '1:10');
      
      const parsedMessages = await Promise.all(
        rawMessages.map(async (raw) => {
          const parsed = await simpleParser(raw);
          return {
            from: parsed.from?.text || '',
            to: parsed.to?.text || '',
            subject: parsed.subject || '',
            date: parsed.date || new Date(),
            text: parsed.text || '',
            html: parsed.html || '',
          };
        })
      );
      
      result = { messages: parsedMessages };
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