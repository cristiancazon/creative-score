'use client';

import MatchForm from '@/components/admin/MatchForm';
import { use } from 'react';

export default function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <MatchForm id={id} />;
}
