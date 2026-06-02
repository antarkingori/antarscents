'use client';
import { useState, useEffect } from 'react';
import { settingsApi } from '@/lib/api';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const SETTING_GROUPS = [
  {
    title: 'Contact & Support',
    settings: [
      { key: 'whatsapp_number', label: 'WhatsApp Number', help: 'Used on the WhatsApp chat button (digits only, e.g. 254922748842)' },
      { key: 'contact_email', label: 'Contact Email', type: 'email' },
    ]
  },
  {
    title: 'Store Info',
    settings: [
      { key: 'shop_name', label: 'Shop Name' },
      { key: 'tagline', label: 'Tagline' },
      { key: 'announcement_bar', label: 'Announcement Bar Text', help: 'Shown at the very top of the site' },
    ]
  },
  {
    title: 'M-Pesa Configuration',
    settings: [
      { key: 'mpesa_till_number', label: 'Till Number', help: 'Displayed on checkout M-Pesa payment instructions' },
    ]
  },
  {
    title: 'Delivery Fees (KES)',
    settings: [
      { key: 'delivery_fee_cbd', label: 'Nairobi CBD', type: 'number' },
      { key: 'delivery_fee_nairobi', label: 'Within Nairobi', type: 'number' },
      { key: 'delivery_fee_outside', label: 'Outside Nairobi (up to 100km)', type: 'number' },
      { key: 'delivery_fee_far', label: 'Far Upcountry', type: 'number' },
    ]
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    settingsApi.getAll().then(r => setSettings(r.data.data || {})).finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(key);
    try {
      await settingsApi.update(key, value);
      toast.success('Setting saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(null); }
  };

  const handleSaveGroup = async (keys: string[]) => {
    setSaving('group');
    try {
      await Promise.all(keys.map(k => settingsApi.update(k, settings[k] || '')));
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(null); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-gold" /></div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div><h1 className="font-playfair text-2xl font-bold">Settings</h1><p className="text-gray-400 text-sm mt-1">Manage your store configuration</p></div>

      {SETTING_GROUPS.map(group => (
        <div key={group.title} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-5 text-gold">{group.title}</h2>
          <div className="space-y-5">
            {group.settings.map(s => (
              <div key={s.key} className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="sm:w-48">
                  <label className="text-sm font-medium text-gray-300">{s.label}</label>
                  {s.help && <p className="text-xs text-gray-500 mt-0.5">{s.help}</p>}
                </div>
                <div className="flex flex-1 gap-2">
                  <input
                    type={s.type || 'text'}
                    value={settings[s.key] || ''}
                    onChange={e => setSettings(p => ({ ...p, [s.key]: e.target.value }))}
                    className="input-dark text-sm flex-1"
                  />
                  <button
                    onClick={() => handleSave(s.key, settings[s.key] || '')}
                    disabled={saving === s.key}
                    className="btn-gold px-3 py-2 flex-shrink-0"
                  >
                    {saving === s.key ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  </button>
                </div>
              </div>
            ))}
            {group.settings.length > 1 && (
              <button
                onClick={() => handleSaveGroup(group.settings.map(s => s.key))}
                disabled={saving === 'group'}
                className="btn-outline-gold px-5 py-2 text-sm flex items-center gap-2"
              >
                {saving === 'group' ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save All</>}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
