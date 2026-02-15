'use client';

import BoardForm from '@/components/admin/BoardForm';
import { use } from 'react';

export default function EditBoardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <BoardForm id={id} />;
}
