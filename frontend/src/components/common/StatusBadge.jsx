export default function StatusBadge({ status }) {
  const map = {
    active:    { label: 'Active',    cls: 'badge-active'    },
    claimed:   { label: 'Claimed',   cls: 'badge-claimed'   },
    collected: { label: 'Collected', cls: 'badge-collected' },
    delivered: { label: 'Delivered', cls: 'badge-delivered' },
    closed:    { label: 'Closed',    cls: 'badge-closed'    },
    assigned:   { label: 'Assigned',   cls: 'badge-claimed'  },
    'in-progress': { label: 'In Progress', cls: 'badge-collected' },
    pending:   { label: 'Pending',   cls: 'badge-pending'   },
    approved:  { label: 'Approved',  cls: 'badge-approved'  },
    rejected:  { label: 'Rejected',  cls: 'badge-rejected'  },
    veg:       { label: '🌿 Veg',    cls: 'badge-veg'       },
    'non-veg': { label: '🍖 Non-Veg', cls: 'badge-nonveg'  },
    both:      { label: '🍱 Mixed',  cls: 'badge-active'    },
  };

  const entry = map[status] || { label: status, cls: 'badge-closed' };

  return <span className={`badge ${entry.cls}`}>{entry.label}</span>;
}
