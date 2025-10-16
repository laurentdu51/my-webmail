import { useState, useEffect } from 'react';
import { supabase, EmailAccount } from './lib/supabase';
import { fetchMessages, EmailMessage } from './lib/emailService';
import AuthForm from './components/AuthForm';
import AccountSetup from './components/AccountSetup';
import FolderList from './components/FolderList';
import EmailList from './components/EmailList';
import EmailViewer from './components/EmailViewer';
import EmailComposer from './components/EmailComposer';
import { Plus, Settings, LogOut, Mail, Edit } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);
  const [selectedFolder, setSelectedFolder] = useState('INBOX');
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<EmailMessage | undefined>();
  const [loading, setLoading] = useState(false);
  const [editAccount, setEditAccount] = useState<EmailAccount | undefined>();

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user || null);
        if (session?.user) {
          loadAccounts();
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadMessages();
    }
  }, [selectedAccount, selectedFolder]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      loadAccounts();
    }
  };

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (data) {
      setAccounts(data);
      if (data.length > 0 && !selectedAccount) {
        setSelectedAccount(data[0]);
      }
    }
  };

  const loadMessages = async () => {
    if (!selectedAccount) return;

    setLoading(true);
    try {
      const msgs = await fetchMessages(selectedAccount.id, selectedFolder);
      setMessages(msgs.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccounts([]);
    setSelectedAccount(null);
    setMessages([]);
  };

  const handleReply = (email: EmailMessage) => {
    setReplyToEmail(email);
    setShowComposer(true);
  };

  const handleNewMessage = () => {
    setReplyToEmail(undefined);
    setShowComposer(true);
  };

  const handleEditAccount = () => {
    if (selectedAccount) {
      setEditAccount(selectedAccount);
      setShowAccountSetup(true);
    }
  };

  if (!user) {
    return <AuthForm onAuth={checkUser} />;
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Mail size={32} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue !
          </h2>
          <p className="text-gray-600 mb-6">
            Configurez votre premier compte e-mail pour commencer
          </p>
          <button
            onClick={() => setShowAccountSetup(true)}
            className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            <span>Ajouter un compte</span>
          </button>
          <button
            onClick={handleLogout}
            className="mt-4 text-sm text-gray-600 hover:text-gray-800"
          >
            Se déconnecter
          </button>
        </div>
        {showAccountSetup && (
          <AccountSetup
            onClose={() => setShowAccountSetup(false)}
            onSave={(account) => {
              setAccounts([account]);
              setSelectedAccount(account);
            }}
          />
        )}
      </div>
    );
  }

  const folders = ['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam'];

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Mail size={28} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Messagerie</h1>
          </div>
          {selectedAccount && (
            <div className="flex items-center space-x-2 ml-8">
              <select
                value={selectedAccount.id}
                onChange={(e) => {
                  const account = accounts.find(a => a.id === e.target.value);
                  setSelectedAccount(account || null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handleEditAccount}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Modifier le compte"
              >
                <Edit size={18} />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleNewMessage}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            <span>Nouveau</span>
          </button>
          <button
            onClick={() => {
              setEditAccount(undefined);
              setShowAccountSetup(true);
            }}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Ajouter un compte"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Se déconnecter"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <FolderList
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
        />
        <div className="flex-1 flex overflow-hidden">
          <div className="w-96">
            <EmailList
              accountId={selectedAccount?.id || ''}
              folder={selectedFolder}
              messages={messages}
              onSelectEmail={setSelectedEmail}
              onRefresh={loadMessages}
              loading={loading}
            />
          </div>
          <EmailViewer
            email={selectedEmail}
            onClose={() => setSelectedEmail(null)}
            onReply={handleReply}
          />
        </div>
      </div>

      {showAccountSetup && (
        <AccountSetup
          onClose={() => {
            setShowAccountSetup(false);
            setEditAccount(undefined);
          }}
          onSave={(account) => {
            if (editAccount) {
              setAccounts(accounts.map(a => a.id === account.id ? account : a));
              if (selectedAccount?.id === account.id) {
                setSelectedAccount(account);
              }
            } else {
              setAccounts([...accounts, account]);
            }
          }}
          editAccount={editAccount}
        />
      )}

      {showComposer && selectedAccount && (
        <EmailComposer
          accountId={selectedAccount.id}
          onClose={() => {
            setShowComposer(false);
            setReplyToEmail(undefined);
          }}
          onSent={loadMessages}
          replyTo={replyToEmail}
        />
      )}
    </div>
  );
}

export default App;
