import React from 'react';
import { Eye, Edit3, Trash2 } from 'lucide-react';

// ── Tombol aksi konsisten: Detail / Edit / Hapus ────────────────────────────
interface ActionButtonsProps {
  onDetail?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  detailLabel?: string;
  detailTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
  show?: { detail?: boolean; edit?: boolean; delete?: boolean };
}

const btnBase =
  'min-h-8 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold';

const btnStyles = {
  detail: 'text-[#2C4219] hover:bg-[#efe0d2]',
  edit: 'text-amber-700 hover:bg-amber-50',
  delete: 'text-red-600 hover:bg-red-50',
} as const;

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onDetail,
  onEdit,
  onDelete,
  detailLabel = 'Detail',
  detailTitle = 'Lihat Detail',
  editTitle = 'Edit Data',
  deleteTitle = 'Hapus Data',
  show = {} as NonNullable<ActionButtonsProps['show']>,
}) => {
  const showDetail = show.detail !== false && onDetail;
  const showEdit = show.edit !== false && onEdit;
  const showDelete = show.delete !== false && onDelete;

  if (!showDetail && !showEdit && !showDelete) return null;

  return (
    <div className="flex items-center justify-center gap-1">
      {showDetail && (
        <button
          type="button"
          onClick={onDetail}
          className={`${btnBase} ${btnStyles.detail}`}
          title={detailTitle}
        >
          <Eye className="w-4 h-4" />
          <span>{detailLabel}</span>
        </button>
      )}
      {showEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={`${btnBase} ${btnStyles.edit}`}
          title={editTitle}
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit</span>
        </button>
      )}
      {showDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`${btnBase} ${btnStyles.delete}`}
          title={deleteTitle}
        >
          <Trash2 className="w-4 h-4" />
          <span>Hapus</span>
        </button>
      )}
    </div>
  );
};
