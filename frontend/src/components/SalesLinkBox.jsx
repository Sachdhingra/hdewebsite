import React from 'react';
import { toast } from 'sonner';
import { Copy, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { salespersonLink } from '../utils/api';

// A salesperson's personal website link, with Copy and Share on WhatsApp.
// Any enquiry a customer sends after opening this link is assigned to that salesperson.
const SalesLinkBox = ({ salesperson, compact = false }) => {
  const link = salespersonLink(salesperson.code);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(`${salesperson.name}'s link copied`);
    } catch (e) {
      window.prompt('Copy this link', link);
    }
  };

  const shareText = `Hi, this is ${salesperson.name} from Home Decor Enterprises. You can browse our furniture here and send an enquiry: ${link}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className={compact ? 'flex items-center gap-2 flex-wrap' : 'bg-amber-50 border border-amber-200 rounded-lg p-4'}>
      {!compact && (
        <p className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-2">
          <LinkIcon size={16} />
          {salesperson.name}'s website link
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-sm bg-white border border-gray-200 rounded px-2 py-1 break-all">{link}</code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-md bg-gray-800 text-white hover:bg-gray-700"
        >
          <Copy size={14} /> Copy
        </button>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"
        >
          <MessageCircle size={14} /> Share on WhatsApp
        </a>
      </div>
      {!compact && (
        <p className="text-xs text-amber-800 mt-2">
          Send only this link to your customers. Every enquiry they send from the website lands on your page.
        </p>
      )}
    </div>
  );
};

export default SalesLinkBox;
