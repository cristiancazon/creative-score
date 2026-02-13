'use client';

import TeamForm from '@/components/admin/TeamForm';
import { use } from 'react';

export default function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <TeamForm id={id} />;
}
