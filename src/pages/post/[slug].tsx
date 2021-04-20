import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';
import { FaUser } from 'react-icons/fa';
import { format } from 'date-fns';
import Head from 'next/head';
import Header from '../../components/Header';
import ptBr from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
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
  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <div className={styles.content}>
        <Header />
        <div className={styles.container}>
          <div className="post">
            <div className="post_header">
              <img src={post.data.banner.url} alt="image" />
            </div>
            <div className="post_header_info">
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
                  <FiClock />4 min
                </span>
              </div>
            </div>
            <div
              dangerouslySetInnerHTML={{
                __html: post.data.content[0].body[0].text,
              }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  // const posts = await prismic.query(TODO);

  return {
    paths: [{ params: { slug: 'post' } }],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('posts', String(slug), {});

  // TODO
  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      author: response.data.author,
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      content: [
        {
          heading: response.data.content[0].heading,
          body: [
            {
              text: RichText.asHtml(response.data.content[0].body),
            },
          ],
        },
      ],
    },
  };
  return {
    props: {
      post,
    },
    revalidate: 1,
  };
};
