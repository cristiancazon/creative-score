import BoardDesigner from '@/components/admin/BoardDesigner';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function BoardDesignPage({ params }: PageProps) {
    const { id } = await params;
    return <BoardDesigner boardId={id} />;
}
