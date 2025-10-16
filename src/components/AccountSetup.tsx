import { useState } from 'react';
import { supabase, EmailAccount } from '../lib/supabase';
import { Save, X } from 'lucide-react';

interface AccountSetupProps {
  onClose: () => void;
  onSave: (account: EmailAccount) => void;
  editAccount?: EmailAccount;
}

export default function AccountSetup({ onClose, onSave, editAccount }: AccountSetupProps) {
  const [formData, setFormData] = useState({
    name: editAccount?.name || '',
    email: editAccount?.email || '',
    imap_host: editAccount?.imap_host || '',
    imap_port: editAccount?.imap_port || 993,
    imap_username: editAccount?.imap_username || '',
    imap_password: editAccount?.imap_password || '',
    smtp_host: editAccount?.smtp_host || '',
    smtp_port: editAccount?.smtp_port || 587,
    smtp_username: editAccount?.smtp_username || '',
    smtp_password: editAccount?.smtp_password || '',
    smtp_secure: editAccount?.smtp_secure ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editAccount) {
        const { data, error } = await supabase
          .from('email_accounts')
          .update(formData)
          .eq('id', editAccount.id)
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      } else {
        const { data, error } = await supabase
          .from('email_accounts')
          .insert([{ ...formData, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      }

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {editAccount ? 'Modifier le compte' : 'Ajouter un compte e-mail'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du compte
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse e-mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuration IMAP (Réception)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serveur IMAP
                </label>
                <input
                  type="text"
                  value={formData.imap_host}
                  onChange={(e) => setFormData({ ...formData, imap_host: e.target.value })}
                  placeholder="imap.example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port IMAP
                </label>
                <input
                  type="number"
                  value={formData.imap_port}
                  onChange={(e) => setFormData({ ...formData, imap_port: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur IMAP
                </label>
                <input
                  type="text"
                  value={formData.imap_username}
                  onChange={(e) => setFormData({ ...formData, imap_username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe IMAP
                </label>
                <input
                  type="password"
                  value={formData.imap_password}
                  onChange={(e) => setFormData({ ...formData, imap_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuration SMTP (Envoi)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serveur SMTP
                </label>
                <input
                  type="text"
                  value={formData.smtp_host}
                  onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                  placeholder="smtp.example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port SMTP
                </label>
                <input
                  type="number"
                  value={formData.smtp_port}
                  onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur SMTP
                </label>
                <input
                  type="text"
                  value={formData.smtp_username}
                  onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe SMTP
                </label>
                <input
                  type="password"
                  value={formData.smtp_password}
                  onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.smtp_secure}
                    onChange={(e) => setFormData({ ...formData, smtp_secure: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Utiliser TLS/SSL
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              <Save size={18} />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
