'use client';

import VideoAdForm from '@/components/admin/VideoAdForm';
import { use } from 'react';

export default function EditVideoAdPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <VideoAdForm id={id} />;
}
