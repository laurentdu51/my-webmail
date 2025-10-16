import { useState } from 'react';
import { sendEmail, EmailMessage } from '../lib/emailService';
import { Send, X } from 'lucide-react';

interface EmailComposerProps {
  accountId: string;
  onClose: () => void;
  onSent: () => void;
  replyTo?: EmailMessage;
}

export default function EmailComposer({ accountId, onClose, onSent, replyTo }: EmailComposerProps) {
  const [to, setTo] = useState(replyTo ? replyTo.from.match(/<(.*)>/)?.[1] || replyTo.from : '');
  const [subject, setSubject] = useState(
    replyTo ? `Re: ${replyTo.subject}` : ''
  );
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sendEmail(accountId, to, subject, body);
      onSent();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Nouveau message</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {error && (
            <div className="mx-4 mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="p-4 space-y-3 border-b">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destinataire
              </label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="destinataire@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objet
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet du message"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Écrivez votre message ici..."
              className="w-full h-full min-h-[300px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div className="p-4 border-t flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Send size={18} />
              <span>{loading ? 'Envoi...' : 'Envoyer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
