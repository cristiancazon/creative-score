'use client';

import PlayerForm from '@/components/admin/PlayerForm';
import { use } from 'react';

export default function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <PlayerForm id={id} />;
}
