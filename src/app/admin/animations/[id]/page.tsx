'use client';

import AnimationEditor from '@/components/admin/AnimationEditor';
import { use } from 'react';

export default function EditAnimationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <AnimationEditor id={id === 'new' ? undefined : id} />;
}
