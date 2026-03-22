import { BlogEditor } from '@/components/blog/BlogEditor';

export const metadata = {
  title: 'Edit Blog Post',
};

export default async function EditBlogPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BlogEditor postId={id} />;
}
