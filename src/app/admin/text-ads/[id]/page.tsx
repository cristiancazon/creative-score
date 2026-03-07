'use client';

import TextAdForm from '@/components/admin/TextAdForm';
import { use } from 'react';

export default function EditTextAdPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <TextAdForm id={id} />;
}
