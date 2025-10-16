import { useState, useEffect } from 'react';
import { EmailMessage } from '../lib/emailService';
import { Mail, RefreshCw } from 'lucide-react';

interface EmailListProps {
  accountId: string;
  folder: string;
  onSelectEmail: (email: EmailMessage) => void;
  onRefresh: () => void;
  messages: EmailMessage[];
  loading: boolean;
}

export default function EmailList({
  messages,
  onSelectEmail,
  onRefresh,
  loading
}: EmailListProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (email: EmailMessage, index: number) => {
    setSelectedId(index);
    onSelectEmail(email);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hier';
    } else if (days < 7) {
      return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw size={32} className="animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Chargement des messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Mail size={48} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">Aucun message</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((email, index) => (
              <button
                key={index}
                onClick={() => handleSelect(email, index)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                  selectedId === index ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-semibold text-gray-800 truncate flex-1">
                    {email.from.replace(/<.*>/, '').trim() || email.from}
                  </span>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    {formatDate(email.date)}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1 truncate">
                  {email.subject || '(Sans objet)'}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {email.text?.substring(0, 100) || 'Aucun aperçu disponible'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
