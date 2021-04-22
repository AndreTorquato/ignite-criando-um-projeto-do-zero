import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';
import { FaUser } from 'react-icons/fa';
import { format } from 'date-fns';
import { getPrismicClient } from '../../services/prismic';
import Head from 'next/head';
import Header from '../../components/Header';
import ptBr from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Post {
  uid: string;
  first_publication_date: string | null;
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
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const [estimate, setEstimate] = useState('0 min');
  const router = useRouter();

  useEffect(() => {
    if (!router.isFallback) {
      post.first_publication_date = formatDate(post.first_publication_date);
      setEstimate(String(calculateReadingEstimate(post.data.content)) + ' min');
    }
  }, []);

  function formatDate(date: string) {
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
      acc += current.heading.split(/\s/g).length;
      acc += RichText.asText(current.body).split(/\s/g).length;
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
                    {post.first_publication_date}
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
      </div>
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

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('posts', String(slug), {});
  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      author: response.data.author,
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner?.url,
      },
      content: response.data.content,
    },
  };
  return {
    props: {
      post,
    },
    revalidate: 60 * 30,
  };
};
