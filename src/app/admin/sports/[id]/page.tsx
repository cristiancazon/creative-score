'use client';

import SportForm from '@/components/admin/SportForm';
import { use } from 'react';

export default function EditSportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <SportForm id={id} />;
}
