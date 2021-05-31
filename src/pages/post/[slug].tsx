import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';
import { FaUser } from 'react-icons/fa';
import { format } from 'date-fns';
import { getPrismicClient } from '../../services/prismic';
import Link from 'next/link';
import Head from 'next/head';
import Header from '../../components/Header';
import ptBr from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { Document as PrismicDocument } from '@prismicio/client/types/documents';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUtterances } from '../../hooks/UtterancesComments';
import { ExitPreviewButton } from '../../components/ExitPreviewButton';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';

type LinkPost = {
  name: string;
  slug: string;
};

interface LinksPost {
  beforePost: LinkPost;
  nextPost: LinkPost;
}

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    subtitle: string;
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
  linksPosts: LinksPost;
}

interface PostProps {
  post: Post;
  preview: boolean;
  previewData?: {
    ref: string;
  };
}

const commentNodeId = 'comments';

export default function Post({ post, preview }: PostProps) {
  const [estimate, setEstimate] = useState('0 min');
  const [showLastPBDate, setShowLastPBDate] = useState(false);
  const [firstPBDate, setFirstPBDate] = useState('');
  const router = useRouter();
  useUtterances(commentNodeId);

  useEffect(() => {
    if (!router.isFallback) {
      setFirstPBDate(formatDate(post.first_publication_date));
      setEstimate(String(calculateReadingEstimate(post.data.content)) + ' min');

      if (post.last_publication_date) setShowLastPBDate(true);
    }
  }, []);

  function formatDate(date: string): string {
    const newDate = format(new Date(date), 'dd MMM yyy', {
      locale: ptBr,
    });
    return newDate;
  }

  function calculateReadingEstimate(
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[]
  ) {
    const wordsMinute = 200;
    const totalWords = content.reduce((acc, current) => {
      if (current.heading && current.body.length > 0) {
        acc += current.heading.split(/\s/g).length;
        acc += RichText.asText(current.body).split(/\s/g).length;
      }
      return acc;
    }, 0);

    return Math.ceil(totalWords / wordsMinute);
  }

  return (
    <>
      <Head>
        <title>{post?.data.title}</title>
      </Head>
      <div className={styles.content}>
        <Header />
        <div>
          {router.isFallback ? (
            <div>Carregando...</div>
          ) : (
            <div className={styles.post}>
              <div className={styles.post_header}>
                <img src={post.data.banner?.url} alt="image" />
              </div>
              <div>
                <h1>{post.data.title}</h1>
                <div>
                  <span className={commonStyles.info}>
                    <FiCalendar />
                    {firstPBDate}
                  </span>
                  <span className={commonStyles.info}>
                    <FaUser />
                    {post.data.author}
                  </span>
                  <span className={commonStyles.info}>
                    <FiClock />
                    {estimate}
                  </span>
                </div>
                {showLastPBDate && (
                  <div className={styles.last__pb__date}>
                    {post.last_publication_date}
                  </div>
                )}
              </div>

              {post.data.content.map(content => (
                <div className={styles.container} key={content.heading}>
                  <h2>{content.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  ></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles.navigate__posts}>
          <div className={`${styles.navigate} ${styles.back}`}>
            { post.linksPosts.beforePost.slug && (
              <>
              <div className={styles.navigate__title}>{post.linksPosts.beforePost.name}</div>
              <Link href={`${post.linksPosts.beforePost.slug}`}>
                <a>Post anterior</a>
              </Link>
              </>
            )}
          </div>
          <div className={`${styles.navigate} ${styles.next}`}>
          { post.linksPosts.nextPost.slug && (
              <>
            <div className={styles.navigate__title}>{post.linksPosts.nextPost.name}</div>
            <Link href={`${post.linksPosts.nextPost.slug}`}>
              <a>Próximo post</a>
            </Link>              </>
            )}

          </div>
        </div>
        <div id={commentNodeId}></div>
      </div>
      {preview && <ExitPreviewButton />}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 20,
    }
  );

  const params = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });
  return {
    paths: [...params],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const posts: ApiSearchResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 20,
    }
  );

  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  let lastPbDate = null;

  if (response.last_publication_date) {
    lastPbDate = format(
      new Date(response?.last_publication_date),
      "'*editado em 'dd MMM yyyy', às' HH:mm",
      {
        locale: ptBr,
      }
    );
  }
  const linkedPosts = getLinksPosts(response.uid, posts.results);
  const post: Post = {
    uid: response?.uid,
    first_publication_date: response?.first_publication_date,
    last_publication_date: lastPbDate,
    data: {
      author: response.data.author,
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner?.url,
      },
      content: response.data.content,
    },
    linksPosts: linkedPosts,
  };

  return {
    props: {
      post,
      preview,
    },
    revalidate: 60 * 30,
  };
};

function getLinksPosts(slug: string, posts: PrismicDocument[]): LinksPost {
  const currencyIndexPost = posts.findIndex(post => post?.uid === slug);

  let beforePost: LinkPost = {
    name: null,
    slug: null,
  };
  let nextPost: LinkPost = {
    name: null,
    slug: null,
  };

  if (currencyIndexPost - 1 >= 0) {
    beforePost = {
      name: posts[currencyIndexPost - 1]?.data.title,
      slug: posts[currencyIndexPost - 1]?.uid,
    };
  }

  if (currencyIndexPost + 1 <= posts.length - 1) {
    nextPost = {
      name: posts[currencyIndexPost + 1]?.data.title,
      slug: posts[currencyIndexPost + 1]?.uid,
    };
  }

  return {
    beforePost,
    nextPost,
  };
}
