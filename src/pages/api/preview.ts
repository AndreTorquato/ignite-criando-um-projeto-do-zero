import { Document } from '@prismicio/client/types/documents';
import { getPrismicClient } from '../../services/prismic';

export default async (req, res) => {
  const { token: ref, documentId } = req.query;
  const redirectUrl = await getPrismicClient(req)
    .getPreviewResolver(ref, documentId)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

function linkResolver(doc: Document): string {
  console.log(doc);
  if (doc.type === 'posts') {
    return `/posts/${doc.uid}`;
  }

  return '/';
}
